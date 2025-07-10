package api

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
)

func FetchAPI(url string) {
	// Make the GET request
	resp, err := http.Get(url)
	if err != nil {
		log.Fatal("Error making GET request:", err)
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatal("Error reading response body:", err)
	}

	// Print the response body as a string
	fmt.Println(string(body))
}
