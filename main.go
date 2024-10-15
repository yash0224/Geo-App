// main.go
package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var db *gorm.DB
var jwtKey = []byte(os.Getenv("JWT_SECRET"))

func main() {
	dsn := "sql12737782:7g6gcPwNdH@tcp(sql12.freesqldatabase.com)/sql12737782?charset=utf8mb4&parseTime=True&loc=Local"
	var err error
	db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect database")
	}

	db.AutoMigrate(&User{}, &GeoFile{}, &Shape{})

	r := gin.Default()

	r.Use(corsMiddleware())

	r.POST("/register", registerUser)
	r.POST("/login", loginUser)
	r.POST("/upload", authMiddleware(), uploadFile)
	r.GET("/files", authMiddleware(), getFiles)
	r.GET("/files/:id/content", authMiddleware(), getFileContent) // New route
	r.POST("/shapes", authMiddleware(), createShape)
	r.GET("/shapes", authMiddleware(), getShapes)
	r.GET("/shape/:id", authMiddleware(), getShapeByID)
	r.PUT("/shapes/:id", authMiddleware(), updateShape)
	r.DELETE("/shapes/:id", authMiddleware(), deleteShape)
	r.PUT("/files/:id/content", authMiddleware(), updateFileContent)

	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server")
	}
}

type User struct {
	gorm.Model
	Username string `gorm:"unique" json:"username"`
	Password string `json:"-"`
}

// GeoFile model
type GeoFile struct {
	gorm.Model
	UserID uint   `json:"user_id"`
	Name   string `json:"name"`
	Type   string `json:"type"` // "geojson" or "kml"
	Data   string `json:"data"` // Store file content as string
}

// Shape model
type Shape struct {
	gorm.Model
	UserID   uint   `json:"user_id"`
	Name     string `json:"name"`
	Geometry string `json:"geometry"` // GeoJSON geometry as string
}

func registerUser(c *gin.Context) {
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user.Password = string(hashedPassword)

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully"})
}

func loginUser(c *gin.Context) {
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var dbUser User
	if err := db.Where("username = ?", user.Username).First(&dbUser).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(user.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": dbUser.ID,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": tokenString})
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the token from the "Authorization" header
		tokenString := c.GetHeader("Authorization")

		// Check if the Authorization header is present
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization header"})
			c.Abort()
			return
		}

		// Remove the "Bearer " prefix from the token string
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		// Parse the token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Ensure the token method is what you expect
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			// Return the secret key used to sign the token
			return jwtKey, nil
		})

		// Handle token parsing errors
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token", "message": err.Error()})
			c.Abort()
			return
		}

		// Extract claims from the token
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Set the user_id in the request context
		if userID, ok := claims["user_id"].(float64); ok {
			c.Set("user_id", uint(userID))
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to extract user ID from claims"})
			c.Abort()
			return
		}

		// Continue to the next handler
		c.Next()
	}
}

func uploadFile(c *gin.Context) {
	userID, _ := c.Get("user_id")
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Open the file to read its content
	fileContent, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}
	defer fileContent.Close()

	// Read the content into a buffer
	contentBytes, err := ioutil.ReadAll(fileContent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file content"})
		return
	}

	// Convert file content to string
	fileData := string(contentBytes)

	// Determine file type (GeoJSON or KML)
	fileType := "geo.json"
	if file.Filename[len(file.Filename)-3:] == "kml" {
		fileType = "kml"
	}

	// Create GeoFile record with file content
	geoFile := GeoFile{
		UserID: userID.(uint),
		Name:   file.Filename,
		Type:   fileType,
		Data:   fileData, // Storing the actual file content here
	}

	// Save GeoFile record to the database
	if err := db.Create(&geoFile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file information"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File uploaded successfully"})
}

func getFileContent(c *gin.Context) {
	userID, _ := c.Get("user_id")
	fileID := c.Param("id")

	var file GeoFile
	if err := db.Where("id = ? AND user_id = ?", fileID, userID).First(&file).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve file"})
		}
		return
	}

	// Return both file metadata and content
	c.JSON(http.StatusOK, gin.H{
		"file": gin.H{
			"ID":   file.ID,
			"Name": file.Name,
			"Type": file.Type,
		},
		"content": file.Data,
	})
}
func getFiles(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var files []GeoFile
	if err := db.Where("user_id = ?", userID).Find(&files).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve files"})
		return
	}
	c.JSON(http.StatusOK, files)
}

func createShape(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var shape Shape
	if err := c.ShouldBindJSON(&shape); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	shape.UserID = userID.(uint)
	if err := db.Create(&shape).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create shape"})
		return
	}
	c.JSON(http.StatusCreated, shape)
}

func getShapes(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var shapes []Shape
	if err := db.Where("user_id = ?", userID).Find(&shapes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve shapes"})
		return
	}
	c.JSON(http.StatusOK, shapes)
}
func getShapeByID(c *gin.Context) {
	userID, _ := c.Get("user_id")
	shapeID := c.Param("id") // Get the shape ID from the URL parameters

	var shape Shape
	if err := db.Where("user_id = ? AND id = ?", userID, shapeID).First(&shape).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Shape not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve shape"})
		}
		return
	}
	c.JSON(http.StatusOK, shape)
}
func updateShape(c *gin.Context) {
	userID, _ := c.Get("user_id")
	shapeID := c.Param("id")
	var shape Shape
	if err := c.ShouldBindJSON(&shape); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := db.Where("id = ? AND user_id = ?", shapeID, userID).Updates(&shape).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update shape"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Shape updated successfully"})
}

func deleteShape(c *gin.Context) {
	userID, _ := c.Get("user_id")
	shapeID := c.Param("id")
	if err := db.Where("id = ? AND user_id = ?", shapeID, userID).Delete(&Shape{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete shape"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Shape deleted successfully"})
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func updateFileContent(c *gin.Context) {
	userID, _ := c.Get("user_id")
	fileID := c.Param("id")

	var updateData struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var file GeoFile
	if err := db.Where("id = ? AND user_id = ?", fileID, userID).First(&file).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve file"})
		}
		return
	}

	file.Data = updateData.Content

	if err := db.Save(&file).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update file content"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File content updated successfully"})
}
