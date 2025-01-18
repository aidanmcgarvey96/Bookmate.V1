class BookshelfAnalyzer {
    constructor() {
        this.setupEventListeners();
        this.books = [];
        this.filters = new Set();
    }

    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const cameraButton = document.getElementById('cameraButton');
        const uploadButton = document.getElementById('uploadButton');

        cameraButton.addEventListener('click', () => {
            fileInput.setAttribute('capture', 'environment');
            fileInput.click();
        });

        uploadButton.addEventListener('click', () => {
            fileInput.removeAttribute('capture');
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => this.handleImageSelect(e));
    }

    async handleImageSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Show image preview
        const preview = document.getElementById('imagePreview');
        const selectedImage = document.getElementById('selectedImage');
        preview.classList.remove('preview-hidden');
        selectedImage.src = URL.createObjectURL(file);

        // Show loading spinner
        this.toggleLoading(true);

        // Simulate API delay
        setTimeout(() => {
            try {
                // Mock data for testing frontend
                const mockData = {
                    detected: [
                        {
                            title: "The Midnight Library",
                            author: "Matt Haig",
                            rating: "4.2",
                            cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190253i/52578297.jpg",
                            genres: ["Fiction", "Fantasy", "Contemporary"],
                            description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived."
                        },
                        {
                            title: "Atomic Habits",
                            author: "James Clear",
                            rating: "4.5",
                            cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg",
                            genres: ["Self Help", "Personal Development", "Psychology"],
                            description: "No matter your goals, Atomic Habits offers a proven framework for improving--every day."
                        }
                    ],
                    recommendations: [
                        {
                            title: "Project Hail Mary",
                            author: "Andy Weir",
                            rating: "4.6",
                            cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1597695864i/54493401.jpg",
                            genres: ["Science Fiction", "Fiction", "Space"],
                            description: "Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself will perish."
                        }
                    ]
                };

                // Generate filters
                this.generateFilters(mockData.detected);
                
                // Display results
                this.displayResults(mockData.detected, mockData.recommendations);
            } catch (error) {
                console.error('Error processing image:', error);
                alert('Error processing image. Please try again.');
            } finally {
                this.toggleLoading(false);
            }
        }, 1500); // Simulate 1.5s loading time
    }

    generateFilters(bookDetails) {
        const filterTags = document.getElementById('filterTags');
        filterTags.innerHTML = '';

        const genres = new Set();
        bookDetails.forEach(book => {
            book.genres.forEach(genre => genres.add(genre));
        });

        genres.forEach(genre => {
            const tag = document.createElement('span');
            tag.className = 'filter-tag';
            tag.textContent = genre;
            tag.addEventListener('click', () => this.toggleFilter(genre));
            filterTags.appendChild(tag);
        });
    }

    toggleFilter(filter) {
        if (this.filters.has(filter)) {
            this.filters.delete(filter);
        } else {
            this.filters.add(filter);
        }
        this.updateResults();
    }

    displayResults(bookDetails, recommendations) {
        const resultsSection = document.getElementById('results');
        resultsSection.classList.remove('hidden');

        // Display detected books
        const detectedBooksElement = document.getElementById('detectedBooks');
        detectedBooksElement.innerHTML = this.generateBookHTML(bookDetails);

        // Display recommendations
        const recommendationsElement = document.getElementById('recommendations');
        recommendationsElement.innerHTML = this.generateBookHTML(recommendations);
    }

    generateBookHTML(books) {
        return books.map(book => `
            <div class="book-card">
                <img src="${book.cover}" alt="${book.title}" class="book-cover">
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">by ${book.author}</p>
                    <p class="book-rating">Rating: ${book.rating}/5</p>
                    <div class="book-genres">
                        ${book.genres.map(genre => 
                            `<span class="genre-tag">${genre}</span>`
                        ).join('')}
                    </div>
                    <p class="book-description">${book.description}</p>
                </div>
            </div>
        `).join('');
    }

    toggleLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        spinner.classList.toggle('hidden', !show);
    }

    updateResults() {
        // Update displayed results based on active filters
        const filterTags = document.querySelectorAll('.filter-tag');
        filterTags.forEach(tag => {
            tag.classList.toggle('active', this.filters.has(tag.textContent));
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new BookshelfAnalyzer();
}); 