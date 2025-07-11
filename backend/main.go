package main

import (
	"backend/db"
	"backend/handlers"
	"fmt"
	"log"
	"net/http"

	"os"

	"github.com/joho/godotenv"
)

func main() {

	errGo := godotenv.Load()
	if errGo != nil {
		log.Fatal("Error loading .env file")
	}

	// 1. Connect to MongoDB
	mongoURI := os.Getenv("MONGO_URI")
	db.ConnectMongo(mongoURI)

	// 2. Use your handlers
	http.HandleFunc("/", handlers.HelloHandler)
	http.HandleFunc("/signup", handlers.PostManualSignUpHandler)
	http.HandleFunc("/google-signup", handlers.PostGoogleSignUpHandler)
	http.HandleFunc("/signin", handlers.PostManualSignInHandler)
	http.HandleFunc("/google-signin", handlers.PostGoogleSignInHandler)
	http.HandleFunc("/request-otp", handlers.PostRequestOTPHandler)
	http.HandleFunc("/verify-otp", handlers.PostVerifyOTPHandler)
	http.HandleFunc("/request-password-reset-otp", handlers.PostRequestPasswordResetOTPHandler)
	http.HandleFunc("/verify-password-reset-otp", handlers.PostVerifyPasswordResetOTPHandler)
	http.HandleFunc("/reset-password", handlers.PostResetPasswordHandler)
	http.HandleFunc("/get-user-details", handlers.GetUserDetailsHandler)
	http.HandleFunc("/update-user-details", handlers.PostUpdateUserDetailsHandler)

	// News endpoint
	http.HandleFunc("/news", handlers.GetNewsHandler)
	http.HandleFunc("/news/article", handlers.GetNewsArticleByURLHandler)
	http.HandleFunc("/news/summary", handlers.PostNewsSummaryHandler)

	// Explore endpoints
	http.HandleFunc("/explore/topics", handlers.GetExploreTopicsHandler)
	http.HandleFunc("/explore/news", handlers.GetExploreNewsByTopicHandler)
	http.HandleFunc("/explore/trending", handlers.GetExploreTrendingHandler)
	http.HandleFunc("/explore/search", handlers.GetExploreSearchHandler)

	// Bookmark endpoints
	http.HandleFunc("/bookmarks/add", handlers.PostAddBookmarkHandler)
	http.HandleFunc("/bookmarks/remove", handlers.PostRemoveBookmarkHandler)
	http.HandleFunc("/bookmarks/list", handlers.GetBookmarksListHandler)

	// Viewed news endpoints
	http.HandleFunc("/viewed-news/add", handlers.PostViewedNewsHandler)
	http.HandleFunc("/viewed-news/list", handlers.GetViewedNewsListHandler)

	fmt.Println("Server starting on port 8080...")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
