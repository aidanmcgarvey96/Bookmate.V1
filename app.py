from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import vision
import os
import io
from goodreads_scraper import GoodreadsScraper
import re
from PIL import Image
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Google Cloud Vision client
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'path/to/your/credentials.json'
vision_client = vision.ImageAnnotatorClient()

def detect_books_in_image(image_file):
    # Convert the image file to bytes
    content = image_file.read()
    image = vision.Image(content=content)

    # Perform text detection
    response = vision_client.text_detection(image=image)
    texts = response.text_annotations

    if not texts:
        return []

    # Extract all text found in the image
    full_text = texts[0].description
    
    # Split text into lines and clean up
    lines = full_text.split('\n')
    potential_titles = []
    
    # Basic filtering for potential book titles
    for line in lines:
        # Remove special characters and extra spaces
        cleaned_line = re.sub(r'[^\w\s]', '', line).strip()
        
        # Basic heuristic: lines with 2+ words and length > 10 chars might be titles
        if len(cleaned_line.split()) >= 2 and len(cleaned_line) > 10:
            potential_titles.append(cleaned_line)
    
    return potential_titles

def get_book_details(book_titles):
    scraper = GoodreadsScraper()
    book_details = []
    
    for title in book_titles:
        try:
            # Search for the book on Goodreads
            search_results = scraper.search_books(title)
            if search_results:
                book = search_results[0]  # Get the first match
                
                # Get additional details
                details = scraper.get_book_details(book['url'])
                
                book_details.append({
                    'title': book['title'],
                    'author': book['author'],
                    'rating': book['rating'],
                    'cover': book['cover_url'],
                    'genres': details['genres'],
                    'description': details['description'],
                    'similar_books': details['similar_books']
                })
        except Exception as e:
            print(f"Error processing book {title}: {str(e)}")
            continue
    
    return book_details

def generate_recommendations(book_details):
    if not book_details:
        return []
    
    # Collect all genres from input books
    all_genres = {}
    for book in book_details:
        for genre in book['genres']:
            all_genres[genre] = all_genres.get(genre, 0) + 1
    
    # Get the most common genres
    common_genres = sorted(all_genres.items(), key=lambda x: x[1], reverse=True)[:3]
    
    # Collect similar books from all input books
    recommendations = []
    seen_titles = set(book['title'] for book in book_details)
    
    for book in book_details:
        for similar in book['similar_books']:
            if similar['title'] not in seen_titles:
                recommendations.append(similar)
                seen_titles.add(similar['title'])
    
    # Sort recommendations by rating
    recommendations.sort(key=lambda x: float(x['rating']), reverse=True)
    
    return recommendations[:10]  # Return top 10 recommendations

@app.route('/api/analyze-image', methods=['POST'])
def analyze_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    try:
        image_file = request.files['image']
        
        # 1. Detect books in image
        detected_books = detect_books_in_image(image_file)
        
        if not detected_books:
            return jsonify({'error': 'No books detected in image'}), 400
        
        # 2. Get book details from Goodreads
        book_details = get_book_details(detected_books)
        
        # 3. Generate recommendations
        recommendations = generate_recommendations(book_details)
        
        return jsonify({
            'detected_books': book_details,
            'recommendations': recommendations
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 