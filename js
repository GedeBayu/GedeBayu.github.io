// Ini memerlukan library zip.js untuk bekerja
// Tambahkan ini di head:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/zip.js/2.6.62/zip.min.js"></script>

class CBZReader {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentPage = 0;
    this.totalPages = 0;
    this.pages = [];
    this.pageImage = document.getElementById('manga-page');
    this.currentPageElement = document.getElementById('current-page');
    this.totalPagesElement = document.getElementById('total-pages');
  }

  async loadCBZ(url) {
    try {
      // Fetch the CBZ file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load CBZ file');
      }
      
      const blob = await response.blob();
      // Use zip.js to read the ZIP/CBZ file
      const zipReader = new zip.ZipReader(new zip.BlobReader(blob));
      const entries = await zipReader.getEntries();
      
      // Filter only image files and sort them
      this.pages = entries
        .filter(entry => /\.(jpe?g|png|gif|webp)$/i.test(entry.filename))
        .sort((a, b) => {
          // Natural sort for filenames (page1.jpg, page2.jpg, etc.)
          const aName = a.filename.replace(/^.*?(\d+).*$/, '$1');
          const bName = b.filename.replace(/^.*?(\d+).*$/, '$1');
          return parseInt(aName) - parseInt(bName);
        });
      
      this.totalPages = this.pages.length;
      this.totalPagesElement.textContent = this.totalPages;
      
      // Display the first page
      if (this.totalPages > 0) {
        await this.showPage(0);
      }
      
      return true;
    } catch (error) {
      console.error('Error loading CBZ:', error);
      alert('Failed to load the manga. Please try again later.');
      return false;
    }
  }

  async showPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= this.totalPages) {
      return false;
    }
    
    try {
      const entry = this.pages[pageIndex];
      const blob = await entry.getData(new zip.BlobWriter());
      const imageUrl = URL.createObjectURL(blob);
      
      this.pageImage.src = imageUrl;
      this.currentPage = pageIndex;
      this.currentPageElement.textContent = pageIndex + 1;
      
      // Free previous blob URLs to prevent memory leaks
      if (this.prevBlobUrl) {
        URL.revokeObjectURL(this.prevBlobUrl);
      }
      this.prevBlobUrl = imageUrl;
      
      return true;
    } catch (error) {
      console.error('Error showing page:', error);
      return false;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.showPage(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.showPage(this.currentPage - 1);
    }
  }
}

// Contoh penggunaan:
document.addEventListener('DOMContentLoaded', async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const mangaId = urlParams.get('id');
  const cbzUrl = `manga/${mangaId}.cbz`; // Path ke file CBZ
  
  const readerContainer = document.getElementById('manga-reader');
  const reader = new CBZReader(readerContainer);
  
  // Tambahkan event listeners
  document.getElementById('prev-page').addEventListener('click', () => reader.prevPage());
  document.getElementById('next-page').addEventListener('click', () => reader.nextPage());
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      reader.prevPage();
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      reader.nextPage();
    }
  });
  
  // Load the CBZ file
  if (mangaId) {
    try {
      await reader.loadCBZ(cbzUrl);
    } catch (error) {
      console.error('Failed to load manga:', error);
      alert('Gagal memuat manga. Coba lagi nanti.');
    }
  }
});
