package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"backend/db"

	"math/rand"
	"sync"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
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
		Email    string `json:"email"`
		Username string `json:"username"`
		Password string `json:"password"`
		FullName string `json:"fullName"`
		Phone    string `json:"phone"`
		Bio      string `json:"bio"`
		Website  string `json:"website"`
		Avatar   string `json:"avatar"`
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
	res1, err1 := usersCol.UpdateOne(ctx, bson.M{"email": data.Email}, update)
	res2, err2 := googleCol.UpdateOne(ctx, bson.M{"email": data.Email}, update)
	if (err1 != nil || res1.MatchedCount == 0) && (err2 != nil || res2.MatchedCount == 0) {
		http.Error(w, "User not found or failed to update", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "User details updated successfully"})
}
