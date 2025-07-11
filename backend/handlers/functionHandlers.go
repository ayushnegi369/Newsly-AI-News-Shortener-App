package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"backend/db"

	"math/rand"
	"sync"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
	gopkgmail "gopkg.in/gomail.v2"
)

// In-memory OTP store: email -> {otp, timestamp, username, password}
var otpStore = struct {
	sync.RWMutex
	m map[string]struct {
		OTP       string
		CreatedAt time.Time
		Username  string
		Password  string
	}
}{m: make(map[string]struct {
	OTP       string
	CreatedAt time.Time
	Username  string
	Password  string
})}

// In-memory OTP store for password reset: email -> {otp, timestamp}
var resetOtpStore = struct {
	sync.RWMutex
	m map[string]struct {
		OTP       string
		CreatedAt time.Time
	}
}{m: make(map[string]struct {
	OTP       string
	CreatedAt time.Time
})}

var jwtSecret = []byte("your_secret_key") // Use env var in production

func generateOTP() string {
	return fmt.Sprintf("%04d", rand.Intn(10000))
}

func sendOTPEmail(to, otp string) error {
	m := gopkgmail.NewMessage()
	m.SetHeader("From", "ayushnegi369@gmail.com")
	m.SetHeader("To", to)
	m.SetHeader("Subject", "Your Newsly Signup OTP")
	m.SetBody("text/plain", fmt.Sprintf("Hello!\n\nYour OTP for Newsly signup is: %s\n\nThis OTP is valid for 5 minutes. Please do not share it with anyone.\n\nThank you for using Newsly!", otp))

	// Use your Gmail App Password here
	d := gopkgmail.NewDialer("smtp.gmail.com", 587, "ayushnegi369@gmail.com", "rgxb xelt kpwd tcia")

	return d.DialAndSend(m)
}

func hashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hash), err
}

func checkPasswordHash(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

func generateJWT(email, username string) (string, error) {
	claims := jwt.MapClaims{
		"email":    email,
		"username": username,
		"exp":      time.Now().Add(72 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

type PostData struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

func userExistsInAnyCollection(ctx context.Context, username, email string) (bool, string) {
	usersCol := db.MongoDatabase.Collection("users")
	googleCol := db.MongoDatabase.Collection("google-signup-users")

	// Only check username if provided
	if username != "" {
		if err := usersCol.FindOne(ctx, bson.M{"username": username}).Err(); err == nil {
			return true, "Username already exists"
		}
		if err := googleCol.FindOne(ctx, bson.M{"username": username}).Err(); err == nil {
			return true, "Username already exists"
		}
	}
	// Check email in users
	if email != "" {
		if err := usersCol.FindOne(ctx, bson.M{"email": email}).Err(); err == nil {
			return true, "Email already exists"
		}
		if err := googleCol.FindOne(ctx, bson.M{"email": email}).Err(); err == nil {
			return true, "Email already exists"
		}
	}
	return false, ""
}

func PostManualSignUpHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var data struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.Unmarshal(body, &data); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// All fields required for manual signup
	if data.Username == "" || data.Email == "" || data.Password == "" {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	exists, msg := userExistsInAnyCollection(ctx, data.Username, data.Email)
	if exists {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"message": msg})
		return
	}

	collection := db.MongoDatabase.Collection("users")
	hashedPassword, err := hashPassword(data.Password)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}
	doc := bson.M{
		"username":  data.Username,
		"email":     data.Email,
		"password":  hashedPassword,
		"createdAt": time.Now(),
	}

	_, err = collection.InsertOne(ctx, doc)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]string{
				"message": "User already exists",
			})
			return
		}
		http.Error(w, "Failed to insert into MongoDB", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "User registered successfully",
	})
}

func PostGoogleSignUpHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var data struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password,omitempty"`
	}
	if err := json.Unmarshal(body, &data); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Both email and username (name) are required for Google signup
	if data.Email == "" || data.Name == "" {
		http.Error(w, "Email and username are required", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	exists, msg := userExistsInAnyCollection(ctx, data.Name, data.Email)
	if exists {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"message": msg})
		return
	}

	collection := db.MongoDatabase.Collection("google-signup-users")
	doc := bson.M{
		"username":  data.Name,
		"email":     data.Email,
		"createdAt": time.Now(),
	}
	if data.Password != "" {
		hashedPassword, err := hashPassword(data.Password)
		if err != nil {
			http.Error(w, "Failed to hash password", http.StatusInternalServerError)
			return
		}
		doc["password"] = hashedPassword
	}

	_, err = collection.InsertOne(ctx, doc)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]string{
				"message": "User already exists",
			})
			return
		}
		http.Error(w, "Failed to insert into MongoDB", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Data received and stored successfully",
	})
}

func PostManualSignInHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var data struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.Unmarshal(body, &data); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	usersCol := db.MongoDatabase.Collection("users")
	googleCol := db.MongoDatabase.Collection("google-signup-users")

	// Try to find in manual users (must match password)
	var user struct {
		Email    string `bson:"email"`
		Password string `bson:"password"`
	}
	err = usersCol.FindOne(ctx, bson.M{"email": data.Email}).Decode(&user)
	if err == nil {
		if checkPasswordHash(data.Password, user.Password) {
			token, err := generateJWT(data.Email, "") // Optionally fetch username
			if err != nil {
				http.Error(w, "Failed to generate token", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"message":  "Sign in successful (manual user)",
				"token":    token,
				"email":    data.Email,
				"username": "",
			})
			return
		} else {
			http.Error(w, "Incorrect password", http.StatusUnauthorized)
			return
		}
	}

	// Try to find in Google users (no password check)
	err = googleCol.FindOne(ctx, bson.M{"email": data.Email}).Decode(&user)
	if err == nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Sign in successful (google user)"})
		return
	}

	http.Error(w, "User not found", http.StatusNotFound)
}

func PostGoogleSignInHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var data struct {
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := json.Unmarshal(body, &data); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	usersCol := db.MongoDatabase.Collection("users")
	googleCol := db.MongoDatabase.Collection("google-signup-users")

	var user struct {
		Email string `bson:"email"`
	}
	err = usersCol.FindOne(ctx, bson.M{"email": data.Email}).Decode(&user)
	if err == nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Sign in successful (manual user)"})
		return
	}

	err = googleCol.FindOne(ctx, bson.M{"email": data.Email}).Decode(&user)
	if err == nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Sign in successful (google user)"})
		return
	}

	// If not found, create a new Google user with username
	doc := bson.M{
		"email":     data.Email,
		"createdAt": time.Now(),
	}
	if data.Name != "" {
		doc["username"] = data.Name
	}
	_, err = googleCol.InsertOne(ctx, doc)
	if err != nil {
		http.Error(w, "Failed to create new Google user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "New Google user created and signed in successfully"})
}

func PostRequestOTPHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}
	var data struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if data.Username == "" || data.Email == "" || data.Password == "" {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	// Check if user already exists in either collection
	exists, msg := userExistsInAnyCollection(ctx, data.Username, data.Email)
	if exists {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"message": msg})
		return
	}
	// Generate OTP and store in map
	otp := generateOTP()
	hashedPassword, err := hashPassword(data.Password)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}
	otpStore.Lock()
	otpStore.m[data.Email] = struct {
		OTP       string
		CreatedAt time.Time
		Username  string
		Password  string
	}{OTP: otp, CreatedAt: time.Now(), Username: data.Username, Password: hashedPassword}
	otpStore.Unlock()
	// Log OTP (replace with email sending in production)
	if err := sendOTPEmail(data.Email, otp); err != nil {
		http.Error(w, "Failed to send OTP email", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "OTP sent to email"})
}

func PostVerifyOTPHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}
	var data struct {
		Email string `json:"email"`
		OTP   string `json:"otp"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	otpStore.RLock()
	entry, ok := otpStore.m[data.Email]
	otpStore.RUnlock()
	if !ok {
		http.Error(w, "No OTP requested for this email", http.StatusNotFound)
		return
	}
	if entry.OTP != data.OTP {
		http.Error(w, "Invalid OTP", http.StatusUnauthorized)
		return
	}
	if time.Since(entry.CreatedAt) > 5*time.Minute {
		otpStore.Lock()
		delete(otpStore.m, data.Email)
		otpStore.Unlock()
		http.Error(w, "OTP expired", http.StatusUnauthorized)
		return
	}
	// Passed: create user in DB
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	collection := db.MongoDatabase.Collection("users")
	doc := bson.M{
		"username":  entry.Username,
		"email":     data.Email,
		"password":  entry.Password,
		"createdAt": time.Now(),
	}
	_, err := collection.InsertOne(ctx, doc)
	if err != nil {
		http.Error(w, "Failed to insert into MongoDB", http.StatusInternalServerError)
		return
	}
	// Remove OTP from map
	otpStore.Lock()
	delete(otpStore.m, data.Email)
	otpStore.Unlock()
	token, err := generateJWT(data.Email, entry.Username)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message":  "User registered successfully",
		"token":    token,
		"email":    data.Email,
		"username": entry.Username,
	})
}

func PostRequestPasswordResetOTPHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}
	var data struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if data.Email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	usersCol := db.MongoDatabase.Collection("users")
	googleCol := db.MongoDatabase.Collection("google-signup-users")
	var user struct {
		Email string `bson:"email"`
	}
	err1 := usersCol.FindOne(ctx, bson.M{"email": data.Email}).Decode(&user)
	err2 := googleCol.FindOne(ctx, bson.M{"email": data.Email}).Decode(&user)
	if err1 != nil && err2 != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	otp := generateOTP()
	resetOtpStore.Lock()
	resetOtpStore.m[data.Email] = struct {
		OTP       string
		CreatedAt time.Time
	}{OTP: otp, CreatedAt: time.Now()}
	resetOtpStore.Unlock()
	if err := sendOTPEmail(data.Email, otp); err != nil {
		http.Error(w, "Failed to send OTP email", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "OTP sent to email"})
}

func PostVerifyPasswordResetOTPHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}
	var data struct {
		Email string `json:"email"`
		OTP   string `json:"otp"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	resetOtpStore.RLock()
	entry, ok := resetOtpStore.m[data.Email]
	resetOtpStore.RUnlock()
	if !ok {
		http.Error(w, "No OTP requested for this email", http.StatusNotFound)
		return
	}
	if entry.OTP != data.OTP {
		http.Error(w, "Invalid OTP", http.StatusUnauthorized)
		return
	}
	if time.Since(entry.CreatedAt) > 5*time.Minute {
		resetOtpStore.Lock()
		delete(resetOtpStore.m, data.Email)
		resetOtpStore.Unlock()
		http.Error(w, "OTP expired", http.StatusUnauthorized)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "OTP verified, proceed to reset password"})
}

func PostResetPasswordHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}
	var data struct {
		Email       string `json:"email"`
		NewPassword string `json:"newPassword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if data.Email == "" || data.NewPassword == "" {
		http.Error(w, "Email and new password are required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	usersCol := db.MongoDatabase.Collection("users")
	googleCol := db.MongoDatabase.Collection("google-signup-users")
	hashedPassword, err := hashPassword(data.NewPassword)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}
	update := bson.M{"$set": bson.M{"password": hashedPassword}}
	res1, err1 := usersCol.UpdateOne(ctx, bson.M{"email": data.Email}, update)
	res2, err2 := googleCol.UpdateOne(ctx, bson.M{"email": data.Email}, update)
	if (err1 != nil || res1.MatchedCount == 0) && (err2 != nil || res2.MatchedCount == 0) {
		http.Error(w, "User not found or failed to update password", http.StatusNotFound)
		return
	}
	resetOtpStore.Lock()
	delete(resetOtpStore.m, data.Email)
	resetOtpStore.Unlock()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Password reset successfully"})
}

func HelloHandler(w http.ResponseWriter, r *http.Request) {
	// Optional: check method
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	fmt.Fprintf(w, "Hello, World! Your server is working 🚀")
}

// Handler to fetch user details by email
func GetUserDetailsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}
	email := r.URL.Query().Get("email")
	if email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	usersCol := db.MongoDatabase.Collection("users")
	googleCol := db.MongoDatabase.Collection("google-signup-users")
	var user bson.M
	err1 := usersCol.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	err2 := googleCol.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err1 != nil && err2 != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	delete(user, "password") // Don't send password
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// Handler to update user details by email
func PostUpdateUserDetailsHandler(w http.ResponseWriter, r *http.Request) {
	// CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	fmt.Println("update-user-details called, method:", r.Method)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}
	var data struct {
		Email       string   `json:"email"`
		Username    string   `json:"username"`
		Password    string   `json:"password"`
		FullName    string   `json:"fullName"`
		Phone       string   `json:"phone"`
		Bio         string   `json:"bio"`
		Website     string   `json:"website"`
		Avatar      string   `json:"avatar"`
		Country     string   `json:"country"`
		Categories  []string `json:"categories"`
		NewsSources []string `json:"newsSources"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if data.Email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	usersCol := db.MongoDatabase.Collection("users")
	googleCol := db.MongoDatabase.Collection("google-signup-users")
	update := bson.M{"$set": bson.M{}}
	if data.Username != "" {
		update["$set"].(bson.M)["username"] = data.Username
	}
	if data.Password != "" {
		hashedPassword, err := hashPassword(data.Password)
		if err != nil {
			http.Error(w, "Failed to hash password", http.StatusInternalServerError)
			return
		}
		update["$set"].(bson.M)["password"] = hashedPassword
	}
	if data.FullName != "" {
		update["$set"].(bson.M)["fullName"] = data.FullName
	}
	if data.Phone != "" {
		update["$set"].(bson.M)["phone"] = data.Phone
	}
	if data.Bio != "" {
		update["$set"].(bson.M)["bio"] = data.Bio
	}
	if data.Website != "" {
		update["$set"].(bson.M)["website"] = data.Website
	}
	if data.Avatar != "" {
		update["$set"].(bson.M)["avatar"] = data.Avatar
	}
	if data.Country != "" {
		update["$set"].(bson.M)["country"] = data.Country
	}
	if data.Categories != nil && len(data.Categories) > 0 {
		update["$set"].(bson.M)["categories"] = data.Categories
	}
	if data.NewsSources != nil && len(data.NewsSources) > 0 {
		update["$set"].(bson.M)["newsSources"] = data.NewsSources
	}
	res1, err1 := usersCol.UpdateOne(ctx, bson.M{"email": data.Email}, update)
	res2, err2 := googleCol.UpdateOne(ctx, bson.M{"email": data.Email}, update)
	if (err1 != nil || res1.MatchedCount == 0) && (err2 != nil || res2.MatchedCount == 0) {
		http.Error(w, "User not found or failed to update", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "User details updated successfully"})
}

// Helper to fetch everything articles from NewsAPI
func fetchEverythingFromNewsAPI(apiKey, q, sources, domains, from, to, language, sortBy string, page int) ([]map[string]interface{}, error) {
	url := fmt.Sprintf("https://newsapi.org/v2/everything?q=%s&sources=%s&domains=%s&from=%s&to=%s&language=%s&sortBy=%s&page=%d&apiKey=%s",
		q, sources, domains, from, to, language, sortBy, page, apiKey)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Failed to fetch everything from NewsAPI: %s", resp.Status)
	}
	var apiResp struct {
		Status       string                   `json:"status"`
		TotalResults int                      `json:"totalResults"`
		Articles     []map[string]interface{} `json:"articles"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, err
	}
	return apiResp.Articles, nil
}

// Handler to fetch news from NewsAPI and return trending and latest news
func GetNewsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	apiKey := os.Getenv("NEWS_API_KEY")
	if apiKey == "" {
		http.Error(w, "News API key not set", http.StatusInternalServerError)
		return
	}

	typeParam := r.URL.Query().Get("type")
	if typeParam == "everything" {
		// Fetch from /v2/everything
		q := r.URL.Query().Get("q")
		sources := r.URL.Query().Get("sources")
		domains := r.URL.Query().Get("domains")
		from := r.URL.Query().Get("from")
		to := r.URL.Query().Get("to")
		language := r.URL.Query().Get("language")
		sortBy := r.URL.Query().Get("sortBy")
		page := 1
		if p := r.URL.Query().Get("page"); p != "" {
			fmt.Sscanf(p, "%d", &page)
		}
		articles, err := fetchEverythingFromNewsAPI(apiKey, q, sources, domains, from, to, language, sortBy, page)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"articles": articles,
		})
		return
	}

	country := r.URL.Query().Get("country")
	if country == "" {
		country = "us"
	}
	category := r.URL.Query().Get("category")
	if category == "" {
		category = "sports"
	}
	searchQ := r.URL.Query().Get("q")

	url := fmt.Sprintf("https://newsapi.org/v2/top-headlines?country=%s&category=%s&apiKey=%s", country, category, apiKey)
	resp, err := http.Get(url)
	if err != nil {
		http.Error(w, "Failed to fetch news", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		http.Error(w, "Failed to fetch news from NewsAPI", http.StatusInternalServerError)
		return
	}

	var apiResp struct {
		Status       string `json:"status"`
		TotalResults int    `json:"totalResults"`
		Articles     []struct {
			Source struct {
				Name string `json:"name"`
			} `json:"source"`
			Author      string `json:"author"`
			Title       string `json:"title"`
			Description string `json:"description"`
			Url         string `json:"url"`
			UrlToImage  string `json:"urlToImage"`
			PublishedAt string `json:"publishedAt"`
			Content     string `json:"content"`
		} `json:"articles"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		http.Error(w, "Failed to decode news response", http.StatusInternalServerError)
		return
	}

	type NewsItem struct {
		Image        string `json:"image"`
		Country      string `json:"country"`
		Title        string `json:"title"`
		NewsCompany  string `json:"newsCompany"`
		PublishedAgo string `json:"publishedAgo"`
	}

	var filtered []NewsItem
	now := time.Now().UTC()
	for _, article := range apiResp.Articles {
		if article.Title == "" || article.UrlToImage == "" {
			continue // skip articles without title or image
		}
		if searchQ != "" && !strings.Contains(strings.ToLower(article.Title), strings.ToLower(searchQ)) {
			continue // filter by search query
		}
		publishedAt, err := time.Parse(time.RFC3339, article.PublishedAt)
		if err != nil {
			publishedAt = now
		}
		delta := now.Sub(publishedAt)
		var publishedAgo string
		if delta.Hours() >= 1 {
			publishedAgo = fmt.Sprintf("%dh ago", int(delta.Hours()))
		} else {
			publishedAgo = fmt.Sprintf("%dm ago", int(delta.Minutes()))
		}
		item := NewsItem{
			Image:        article.UrlToImage,
			Country:      country,
			Title:        article.Title,
			NewsCompany:  article.Source.Name,
			PublishedAgo: publishedAgo,
		}
		filtered = append(filtered, item)
	}

	var trending []NewsItem
	var latest []NewsItem
	for i, item := range filtered {
		if i < 5 {
			trending = append(trending, item)
		} else {
			latest = append(latest, item)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"trending": trending,
		"latest":   latest,
	})
}

// Handler to fetch a single news article by URL
func GetNewsArticleByURLHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}
	apiKey := os.Getenv("NEWS_API_KEY")
	if apiKey == "" {
		http.Error(w, "News API key not set", http.StatusInternalServerError)
		return
	}
	urlParam := r.URL.Query().Get("url")
	if urlParam == "" {
		http.Error(w, "URL is required", http.StatusBadRequest)
		return
	}
	fmt.Println("[DEBUG] /news/article called with url:", urlParam)
	parsed, err := url.Parse(urlParam)
	if err != nil {
		http.Error(w, "Invalid URL", http.StatusBadRequest)
		return
	}
	domain := parsed.Hostname()
	segments := parsed.Path
	q := ""
	if segments != "" {
		parts := strings.Split(segments, "/")
		if len(parts) > 0 {
			q = parts[len(parts)-1]
		}
	}
	fmt.Printf("[DEBUG] NewsAPI everything search: domain=%s, q=%s\n", domain, q)
	articles, err := fetchEverythingFromNewsAPI(apiKey, q, "", domain, "", "", "en", "publishedAt", 1)
	if err != nil {
		fmt.Println("[ERROR] NewsAPI fetch error:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	for _, article := range articles {
		if article["url"] == urlParam {
			fmt.Println("[DEBUG] Article found and returned.")
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(article)
			return
		}
	}
	fmt.Println("[DEBUG] Article not found in NewsAPI response.")
	http.Error(w, "Article not found", http.StatusNotFound)
}

// Handler to summarize a news article using Gemini API
func PostNewsSummaryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		http.Error(w, "Gemini API key not set", http.StatusInternalServerError)
		return
	}
	var req struct {
		Url     string `json:"url"`
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if req.Content == "" && req.Url == "" {
		http.Error(w, "Either content or url is required", http.StatusBadRequest)
		return
	}
	fmt.Println("[DEBUG] /news/summary called with url:", req.Url)
	articleContent := req.Content
	if articleContent == "" && req.Url != "" {
		newsApiKey := os.Getenv("NEWS_API_KEY")
		if newsApiKey == "" {
			http.Error(w, "News API key not set", http.StatusInternalServerError)
			return
		}
		parsed, err := url.Parse(req.Url)
		if err == nil {
			domain := parsed.Hostname()
			segments := parsed.Path
			q := ""
			if segments != "" {
				parts := strings.Split(segments, "/")
				if len(parts) > 0 {
					q = parts[len(parts)-1]
				}
			}
			fmt.Printf("[DEBUG] NewsAPI everything search for summary: domain=%s, q=%s\n", domain, q)
			articles, err := fetchEverythingFromNewsAPI(newsApiKey, q, "", domain, "", "", "en", "publishedAt", 1)
			if err == nil {
				for _, article := range articles {
					if article["url"] == req.Url {
						if desc, ok := article["description"].(string); ok && desc != "" {
							articleContent = desc
						} else if content, ok := article["content"].(string); ok && content != "" {
							articleContent = content
						}
						break
					}
				}
			} else {
				fmt.Println("[ERROR] NewsAPI fetch error for summary:", err)
			}
		}
	}
	if articleContent == "" {
		fmt.Println("[DEBUG] Could not fetch article content for summary.")
		http.Error(w, "Could not fetch article content", http.StatusNotFound)
		return
	}
	// Call Gemini API to summarize
	geminiReq := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"role":  "user",
				"parts": []string{"Summarize this news article in 5-6 lines:\n" + articleContent},
			},
		},
	}
	geminiBody, _ := json.Marshal(geminiReq)
	geminiResp, err := http.Post("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key="+apiKey, "application/json", strings.NewReader(string(geminiBody)))
	if err != nil {
		fmt.Println("[ERROR] Gemini API call error:", err)
		http.Error(w, "Failed to call Gemini API", http.StatusInternalServerError)
		return
	}
	defer geminiResp.Body.Close()
	if geminiResp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(geminiResp.Body)
		fmt.Printf("[ERROR] Gemini API returned status %d: %s\n", geminiResp.StatusCode, string(body))
		http.Error(w, string(body), http.StatusInternalServerError)
		return
	}
	var geminiResult map[string]interface{}
	if err := json.NewDecoder(geminiResp.Body).Decode(&geminiResult); err != nil {
		fmt.Println("[ERROR] Failed to decode Gemini response:", err)
		http.Error(w, "Failed to decode Gemini response", http.StatusInternalServerError)
		return
	}
	// Extract summary from Gemini response
	summary := ""
	if candidates, ok := geminiResult["candidates"].([]interface{}); ok && len(candidates) > 0 {
		if cand, ok := candidates[0].(map[string]interface{}); ok {
			if content, ok := cand["content"].(map[string]interface{}); ok {
				if parts, ok := content["parts"].([]interface{}); ok && len(parts) > 0 {
					if part, ok := parts[0].(map[string]interface{}); ok {
						if text, ok := part["text"].(string); ok {
							summary = text
						}
					}
				}
			}
		}
	}
	fmt.Println("[DEBUG] Gemini summary generated.")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"summary": summary})
}

// --- Explore Handlers ---
func GetExploreTopicsHandler(w http.ResponseWriter, r *http.Request) {
	coll := db.MongoDatabase.Collection("topics")
	cur, err := coll.Find(context.Background(), bson.M{})
	if err != nil {
		http.Error(w, "Failed to fetch topics", http.StatusInternalServerError)
		return
	}
	defer cur.Close(context.Background())
	var topics []bson.M
	if err := cur.All(context.Background(), &topics); err != nil {
		http.Error(w, "Failed to decode topics", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"topics": topics})
}

func GetExploreNewsByTopicHandler(w http.ResponseWriter, r *http.Request) {
	topic := r.URL.Query().Get("topic")
	if topic == "" {
		http.Error(w, "Topic is required", http.StatusBadRequest)
		return
	}
	coll := db.MongoDatabase.Collection("news")
	cur, err := coll.Find(context.Background(), bson.M{"category": topic})
	if err != nil {
		http.Error(w, "Failed to fetch news", http.StatusInternalServerError)
		return
	}
	defer cur.Close(context.Background())
	var news []bson.M
	if err := cur.All(context.Background(), &news); err != nil {
		http.Error(w, "Failed to decode news", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"news": news})
}

func GetExploreTrendingHandler(w http.ResponseWriter, r *http.Request) {
	coll := db.MongoDatabase.Collection("news")
	cur, err := coll.Find(context.Background(), bson.M{"trending": true})
	if err != nil {
		http.Error(w, "Failed to fetch trending news", http.StatusInternalServerError)
		return
	}
	defer cur.Close(context.Background())
	var trending []bson.M
	if err := cur.All(context.Background(), &trending); err != nil {
		http.Error(w, "Failed to decode trending news", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"trending": trending})
}

func GetExploreSearchHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		http.Error(w, "Query is required", http.StatusBadRequest)
		return
	}
	coll := db.MongoDatabase.Collection("news")
	filter := bson.M{"$or": []bson.M{
		{"title": bson.M{"$regex": q, "$options": "i"}},
		{"description": bson.M{"$regex": q, "$options": "i"}},
		{"category": bson.M{"$regex": q, "$options": "i"}},
	}}
	cur, err := coll.Find(context.Background(), filter)
	if err != nil {
		http.Error(w, "Failed to search news", http.StatusInternalServerError)
		return
	}
	defer cur.Close(context.Background())
	var results []bson.M
	if err := cur.All(context.Background(), &results); err != nil {
		http.Error(w, "Failed to decode search results", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"results": results})
}

// --- Bookmark Handlers ---
func PostAddBookmarkHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		User    string      `json:"user"`
		Article interface{} `json:"article"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if req.User == "" || req.Article == nil {
		http.Error(w, "User and article are required", http.StatusBadRequest)
		return
	}
	coll := db.MongoDatabase.Collection("bookmarks")
	// Prevent duplicate bookmarks (by user and article.url)
	var articleUrl string
	if artMap, ok := req.Article.(map[string]interface{}); ok {
		if urlVal, ok := artMap["url"].(string); ok {
			articleUrl = urlVal
		}
	}
	if articleUrl != "" {
		count, err := coll.CountDocuments(context.Background(), bson.M{"user": req.User, "article.url": articleUrl})
		if err == nil && count > 0 {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"message": "Already bookmarked"})
			return
		}
	}
	bookmark := bson.M{
		"user":      req.User,
		"article":   req.Article,
		"createdAt": time.Now(),
	}
	_, err := coll.InsertOne(context.Background(), bookmark)
	if err != nil {
		http.Error(w, "Failed to add bookmark", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Bookmark added"})
}

func PostRemoveBookmarkHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		User      string `json:"user"`
		ArticleId string `json:"articleId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if req.User == "" || req.ArticleId == "" {
		http.Error(w, "User and articleId are required", http.StatusBadRequest)
		return
	}
	coll := db.MongoDatabase.Collection("bookmarks")
	res, err := coll.DeleteOne(context.Background(), bson.M{"user": req.User, "article.url": req.ArticleId})
	if err != nil || res.DeletedCount == 0 {
		http.Error(w, "Failed to remove bookmark", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Bookmark removed"})
}

func GetBookmarksListHandler(w http.ResponseWriter, r *http.Request) {
	user := r.URL.Query().Get("user")
	if user == "" {
		http.Error(w, "User is required", http.StatusBadRequest)
		return
	}
	coll := db.MongoDatabase.Collection("bookmarks")
	cur, err := coll.Find(context.Background(), bson.M{"user": user})
	if err != nil {
		http.Error(w, "Failed to fetch bookmarks", http.StatusInternalServerError)
		return
	}
	defer cur.Close(context.Background())
	var bookmarks []bson.M
	if err := cur.All(context.Background(), &bookmarks); err != nil {
		http.Error(w, "Failed to decode bookmarks", http.StatusInternalServerError)
		return
	}
	// Only return the article field for each bookmark
	articles := make([]interface{}, 0, len(bookmarks))
	for _, bm := range bookmarks {
		if art, ok := bm["article"]; ok {
			articles = append(articles, art)
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"bookmarks": articles})
}

// --- Viewed News Handlers ---

// POST /viewed-news/add
func PostViewedNewsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		User    string      `json:"user"`
		Article interface{} `json:"article"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if req.User == "" || req.Article == nil {
		http.Error(w, "User and article required", http.StatusBadRequest)
		return
	}
	coll := db.MongoDatabase.Collection("viewed_news")
	// Prevent duplicates: only one entry per user+article.url
	filter := bson.M{"user": req.User}
	if art, ok := req.Article.(map[string]interface{}); ok {
		if url, ok := art["url"]; ok {
			filter["article.url"] = url
		}
	}
	update := bson.M{
		"$set": bson.M{
			"user":     req.User,
			"article":  req.Article,
			"viewedAt": time.Now(),
		},
	}
	_, err := coll.UpdateOne(context.Background(), filter, update, options.Update().SetUpsert(true))
	if err != nil {
		http.Error(w, "Failed to save viewed news", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Viewed news saved"})
}

// GET /viewed-news/list?user=email
func GetViewedNewsListHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}
	user := r.URL.Query().Get("user")
	if user == "" {
		http.Error(w, "User required", http.StatusBadRequest)
		return
	}
	coll := db.MongoDatabase.Collection("viewed_news")
	cur, err := coll.Find(context.Background(), bson.M{"user": user}, options.Find().SetSort(bson.M{"viewedAt": -1}).SetLimit(20))
	if err != nil {
		http.Error(w, "Failed to fetch viewed news", http.StatusInternalServerError)
		return
	}
	defer cur.Close(context.Background())
	var results []bson.M
	if err := cur.All(context.Background(), &results); err != nil {
		http.Error(w, "Failed to decode viewed news", http.StatusInternalServerError)
		return
	}
	// Return only the article objects
	articles := make([]interface{}, 0, len(results))
	for _, doc := range results {
		if art, ok := doc["article"]; ok {
			articles = append(articles, art)
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"viewed": articles})
}
