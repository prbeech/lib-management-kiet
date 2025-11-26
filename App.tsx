import React, { useState, useEffect } from 'react';
import { Book, UserRole, ViewState, RecommendationResponse } from './types';
import { INITIAL_BOOKS, FALLBACK_COVER_URL } from './constants';
import { Navbar } from './components/Navbar';
import { BookCard } from './components/BookCard';
import { LoginPortal } from './components/LoginPortal';
import { getAIRecommendations } from './services/geminiService';
import { Search, Plus, Trash2, ArrowLeft, Sparkles, AlertCircle, CheckCircle2, Heart, Armchair, Monitor, BookOpen, Loader2, BookCheck } from 'lucide-react';

const TOTAL_SEATS = 120;
const ZONES = ['Main Reading Hall', 'Quiet Zone', 'Media Center'] as const;

interface Seat {
  id: number;
  isOccupied: boolean;
  zone: typeof ZONES[number];
}

// Initial seat generation helper
const generateInitialSeats = (): Seat[] => {
  const seats: Seat[] = [];
  let id = 1;
  
  // 60 seats for Main Reading Hall
  for (let i = 0; i < 60; i++) {
    seats.push({ id: id++, isOccupied: Math.random() > 0.6, zone: 'Main Reading Hall' });
  }
  // 30 seats for Quiet Zone
  for (let i = 0; i < 30; i++) {
    seats.push({ id: id++, isOccupied: Math.random() > 0.7, zone: 'Quiet Zone' });
  }
  // 30 seats for Media Center
  for (let i = 0; i < 30; i++) {
    seats.push({ id: id++, isOccupied: Math.random() > 0.5, zone: 'Media Center' });
  }
  return seats;
};

const App: React.FC = () => {
  // State: Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.STUDENT);
  const [username, setUsername] = useState('');

  // State: Data
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [viewHistory, setViewHistory] = useState<Book[]>([]);
  const [wishlist, setWishlist] = useState<Book[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  
  // State: Real-time Features
  const [seats, setSeats] = useState<Seat[]>(generateInitialSeats());
  
  // State: UI & Navigation
  const [currentView, setCurrentView] = useState<ViewState>('CATALOG');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State: AI Features
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [aiReasoning, setAiReasoning] = useState<string>('');
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  // State: Admin Forms
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookGenre, setNewBookGenre] = useState('');
  const [isAddingBook, setIsAddingBook] = useState(false);

  // Derived state
  const availableSeats = seats.filter(s => !s.isOccupied).length;

  // --- Handlers ---

  const handleLogin = (role: UserRole, user: string) => {
    setCurrentRole(role);
    setUsername(user);
    setIsLoggedIn(true);
    setCurrentView(role === UserRole.ADMIN ? 'ADMIN_DASHBOARD' : 'CATALOG');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setWishlist([]); 
    setViewHistory([]);
    setBorrowedBooks([]);
    setSelectedBook(null);
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setCurrentView('DETAILS');
    
    // Add to viewing history if not already most recent
    setViewHistory(prev => {
      if (prev.length > 0 && prev[prev.length - 1].id === book.id) return prev;
      return [...prev, book];
    });
  };

  const handleGoHome = () => {
    setSelectedBook(null);
    setCurrentView(currentRole === UserRole.ADMIN ? 'ADMIN_DASHBOARD' : 'CATALOG');
    setRecommendations([]);
    setAiReasoning('');
  };

  const handleToggleWishlist = (book: Book) => {
    setWishlist(prev => {
      const exists = prev.some(b => b.id === book.id);
      if (exists) {
        return prev.filter(b => b.id !== book.id);
      }
      return [...prev, book];
    });
  };

  const handleBorrowBook = (book: Book) => {
    const isBorrowedByMe = borrowedBooks.some(b => b.id === book.id);

    if (isBorrowedByMe) {
        // Return the book
        setBorrowedBooks(prev => prev.filter(b => b.id !== book.id));
        
        // Update global catalog
        const updatedBooks = books.map(b => 
            b.id === book.id ? { ...b, status: 'In Stock' as const } : b
        );
        setBooks(updatedBooks);
        
        // Update currently selected book view
        if (selectedBook && selectedBook.id === book.id) {
            setSelectedBook({ ...selectedBook, status: 'In Stock' });
        }
    } else {
        // Borrow the book
        if (book.status === 'Out of Stock') return;

        setBorrowedBooks(prev => [...prev, book]);
         // Update global catalog
        const updatedBooks = books.map(b => 
            b.id === book.id ? { ...b, status: 'Out of Stock' as const } : b
        );
        setBooks(updatedBooks);

         // Update currently selected book view
        if (selectedBook && selectedBook.id === book.id) {
            setSelectedBook({ ...selectedBook, status: 'Out of Stock' });
        }
    }
  };

  const isBookInWishlist = (bookId: string) => wishlist.some(b => b.id === bookId);
  const isBookBorrowed = (bookId: string) => borrowedBooks.some(b => b.id === bookId);

  const fetchCoverUrl = async (title: string): Promise<string> => {
    try {
      const response = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`);
      const data = await response.json();
      if (data.docs && data.docs.length > 0 && data.docs[0].cover_i) {
        return `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
      }
    } catch (error) {
      console.error("Error fetching cover:", error);
    }
    return FALLBACK_COVER_URL;
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle || !newBookAuthor) return;

    setIsAddingBook(true);

    const coverUrl = await fetchCoverUrl(newBookTitle);

    const newBook: Book = {
      id: Date.now().toString(),
      title: newBookTitle,
      author: newBookAuthor,
      genre: newBookGenre || 'General',
      description: 'A newly added book to the collection.',
      status: 'In Stock',
      coverUrl: coverUrl,
      rating: 4.0
    };

    setBooks([newBook, ...books]);
    setNewBookTitle('');
    setNewBookAuthor('');
    setNewBookGenre('');
    setIsAddingBook(false);
  };

  const handleDeleteBook = (id: string) => {
    if (confirm('Are you sure you want to delete this book?')) {
      setBooks(books.filter(b => b.id !== id));
      // Also remove from wishlist/borrowed if deleted from catalog
      setWishlist(wishlist.filter(b => b.id !== id));
      setBorrowedBooks(borrowedBooks.filter(b => b.id !== id));
    }
  };

  const handleToggleStock = (id: string) => {
    setBooks(books.map(b => {
      if (b.id === id) {
        return { ...b, status: b.status === 'In Stock' ? 'Out of Stock' : 'In Stock' };
      }
      return b;
    }));
  };

  // --- Real-time Seat Simulation Effect ---
  useEffect(() => {
    // Only simulate if logged in to save resources
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      setSeats(prevSeats => {
        const newSeats = [...prevSeats];
        // Randomly pick 3-6 seats to toggle status
        const numChanges = Math.floor(Math.random() * 4) + 3;
        
        for (let i = 0; i < numChanges; i++) {
          const randomIndex = Math.floor(Math.random() * newSeats.length);
          // Toggle the status
          newSeats[randomIndex] = {
            ...newSeats[randomIndex],
            isOccupied: !newSeats[randomIndex].isOccupied
          };
        }
        return newSeats;
      });
    }, 2500); // Update every 2.5 seconds

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // --- AI Effect ---

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (currentView === 'DETAILS' && selectedBook) {
        setIsLoadingRecs(true);
        // Slight delay to simulate thinking and prevent immediate flicker
        setRecommendations([]);
        
        const response: RecommendationResponse = await getAIRecommendations(
          selectedBook,
          viewHistory,
          books
        );
        
        const recommendedBooks = books.filter(b => response.recommendedBookIds.includes(b.id));
        setRecommendations(recommendedBooks);
        setAiReasoning(response.reasoning);
        setIsLoadingRecs(false);
      }
    };

    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, selectedBook]);

  // --- Filtering ---
  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Render Login Portal if not authenticated ---
  if (!isLoggedIn) {
    return <LoginPortal onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        currentRole={currentRole} 
        username={username}
        onLogout={handleLogout}
        onHomeClick={handleGoHome}
        onWishlistClick={() => {
          setSelectedBook(null);
          setCurrentView('WISHLIST');
        }}
        onLiveSeatsClick={() => {
          setSelectedBook(null);
          setCurrentView('SEAT_MAP');
        }}
        wishlistCount={wishlist.length}
        availableSeats={availableSeats}
        totalSeats={TOTAL_SEATS}
      />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* VIEW: CATALOG (STUDENT) */}
        {currentView === 'CATALOG' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Library Catalog</h2>
                <p className="text-slate-500 mt-1">Explore our extensive collection of knowledge.</p>
              </div>
              <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by title, author, or genre..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {filteredBooks.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 mb-4">
                  <Search className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No books found</h3>
                <p className="mt-1 text-slate-500">Try adjusting your search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredBooks.map(book => (
                  <BookCard key={book.id} book={book} onClick={handleBookClick} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: WISHLIST (STUDENT) */}
        {currentView === 'WISHLIST' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-200 pb-6">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleGoHome}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">My Wishlist</h2>
                  <p className="text-slate-500 mt-1">
                    {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
                  </p>
                </div>
              </div>
            </div>

            {wishlist.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-50 mb-4">
                  <Heart className="h-6 w-6 text-rose-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Your wishlist is empty</h3>
                <p className="mt-1 text-slate-500 mb-6">Start exploring the catalog to add books you love.</p>
                <button 
                  onClick={handleGoHome}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlist.map(book => (
                  <BookCard key={book.id} book={book} onClick={handleBookClick} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: SEAT MAP */}
        {currentView === 'SEAT_MAP' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-200 pb-6">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleGoHome}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Real-Time Seat Map</h2>
                  <p className="text-slate-500 mt-1">
                    Live view of library occupancy. <span className="text-emerald-600 font-semibold">{availableSeats} seats available</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-rose-100 border border-rose-300"></div>
                  <span>Occupied</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {ZONES.map((zone) => {
                const zoneSeats = seats.filter(s => s.zone === zone);
                const zoneAvailable = zoneSeats.filter(s => !s.isOccupied).length;
                const zoneTotal = zoneSeats.length;
                
                let ZoneIcon = BookOpen;
                if (zone === 'Main Reading Hall') ZoneIcon = Armchair;
                if (zone === 'Quiet Zone') ZoneIcon = BookOpen;
                if (zone === 'Media Center') ZoneIcon = Monitor;

                return (
                  <div key={zone} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ZoneIcon className="h-5 w-5 text-indigo-600" />
                        <h3 className="font-semibold text-slate-800">{zone}</h3>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        zoneAvailable > 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {zoneAvailable} / {zoneTotal} Free
                      </span>
                    </div>
                    <div className="p-6 grid grid-cols-4 sm:grid-cols-5 gap-3 bg-slate-50/30 flex-grow content-start">
                      {zoneSeats.map(seat => (
                        <div 
                          key={seat.id}
                          className={`
                            aspect-square rounded-lg flex items-center justify-center border transition-all duration-500 relative group
                            ${seat.isOccupied 
                              ? 'bg-rose-50 border-rose-200 text-rose-300' 
                              : 'bg-emerald-50 border-emerald-200 text-emerald-500 hover:shadow-md cursor-pointer hover:bg-emerald-100'
                            }
                          `}
                          title={`Seat #${seat.id} - ${seat.isOccupied ? 'Occupied' : 'Available'}`}
                        >
                          <Armchair className="h-5 w-5" />
                          <span className="absolute bottom-1 right-1 text-[9px] font-medium opacity-50">{seat.id}</span>
                          
                          {/* Tooltip on Hover */}
                          {!seat.isOccupied && (
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Seat {seat.id}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW: BOOK DETAILS & AI RECOMMENDATIONS */}
        {currentView === 'DETAILS' && selectedBook && (
          <div className="space-y-8 animate-fade-in">
            <button 
              onClick={() => {
                // Return to appropriate previous view
                if (currentRole === UserRole.ADMIN) {
                  handleGoHome();
                } else {
                  handleGoHome();
                }
              }}
              className="group flex items-center text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3 h-96 md:h-auto relative bg-slate-100">
                  <img 
                    src={selectedBook.coverUrl} 
                    alt={selectedBook.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-8 md:w-2/3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                         <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 mb-2">
                           {selectedBook.genre}
                         </span>
                        <h2 className="text-4xl font-bold text-slate-900 mb-2">{selectedBook.title}</h2>
                        <p className="text-xl text-slate-500 mb-6">by {selectedBook.author}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedBook.status === 'In Stock' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {selectedBook.status}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 leading-relaxed text-lg mb-8">
                      {selectedBook.description}
                    </p>
                  </div>

                  <div className="flex gap-4">
                     {currentRole === UserRole.STUDENT && (
                        <button 
                          onClick={() => handleBorrowBook(selectedBook)}
                          disabled={!isBookBorrowed(selectedBook.id) && selectedBook.status === 'Out of Stock'}
                          className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 ${
                            isBookBorrowed(selectedBook.id) 
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                              : selectedBook.status === 'In Stock'
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                          }`}
                        >
                          {isBookBorrowed(selectedBook.id) ? (
                            <>
                              <BookCheck className="h-5 w-5" />
                              Return Book
                            </>
                          ) : selectedBook.status === 'In Stock' ? (
                            'Borrow Book'
                          ) : (
                            'Currently Unavailable'
                          )}
                        </button>
                     )}
                     
                     {currentRole === UserRole.STUDENT && (
                       <button 
                         onClick={() => handleToggleWishlist(selectedBook)}
                         className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                           isBookInWishlist(selectedBook.id)
                             ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'
                             : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100'
                         }`}
                       >
                         <Heart className={`h-5 w-5 ${isBookInWishlist(selectedBook.id) ? 'fill-current' : ''}`} />
                         {isBookInWishlist(selectedBook.id) ? 'Saved' : 'Wishlist'}
                       </button>
                     )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI RECOMMENDATION SECTION */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
               {/* Decorative background element */}
               <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500 opacity-20 rounded-full blur-3xl"></div>

               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-sm">
                      <Sparkles className="h-6 w-6 text-indigo-300" />
                    </div>
                    <h3 className="text-2xl font-bold">Kiet AI Recommendations</h3>
                 </div>

                 {isLoadingRecs ? (
                   <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mb-4"></div>
                     <p>Analyzing literary patterns and your reading history...</p>
                   </div>
                 ) : (
                   <div className="space-y-6">
                     <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                       <h4 className="text-indigo-300 font-medium mb-2 uppercase tracking-wider text-xs">Librarian's Note</h4>
                       <p className="text-slate-200 leading-relaxed font-light">
                         {aiReasoning || "Based on this book, here are some other titles you might enjoy from our collection."}
                       </p>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       {recommendations.length > 0 ? (
                         recommendations.map(book => (
                           <div 
                             key={book.id}
                             onClick={() => handleBookClick(book)}
                             className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-indigo-500/50 rounded-lg p-4 cursor-pointer transition-all duration-200 group flex items-start gap-4"
                           >
                             <img src={book.coverUrl} className="w-16 h-24 object-cover rounded shadow-md" alt={book.title} />
                             <div>
                               <h5 className="font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">{book.title}</h5>
                               <p className="text-slate-400 text-sm mt-1">{book.author}</p>
                               <span className="inline-block mt-2 text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">{book.genre}</span>
                             </div>
                           </div>
                         ))
                       ) : (
                         <div className="col-span-3 text-center text-slate-400 py-4">
                            No specific recommendations found.
                         </div>
                       )}
                     </div>
                   </div>
                 )}
               </div>
            </div>
          </div>
        )}

        {/* VIEW: ADMIN DASHBOARD */}
        {currentView === 'ADMIN_DASHBOARD' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Admin Dashboard</h2>
                <p className="text-slate-500 mt-1">Manage library inventory and assets.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Add New Book Form */}
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-24">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-indigo-600" /> Add New Book
                  </h3>
                  <form onSubmit={handleAddBook} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                        value={newBookTitle}
                        onChange={e => setNewBookTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                        value={newBookAuthor}
                        onChange={e => setNewBookAuthor(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Genre</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                        value={newBookGenre}
                        onChange={e => setNewBookGenre(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isAddingBook}
                      className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {isAddingBook ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Fetching Cover...
                        </>
                      ) : (
                        'Add Book to Catalog'
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Book List Table */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="text-lg font-semibold text-slate-900">Inventory List</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Book Info</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {books.map((book) => (
                          <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded object-cover bg-slate-200" src={book.coverUrl} alt="" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-slate-900 line-clamp-1">{book.title}</div>
                                  <div className="text-sm text-slate-500">{book.author}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button 
                                onClick={() => handleToggleStock(book.id)}
                                className={`flex items-center text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer select-none transition-all ${
                                  book.status === 'In Stock'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                }`}
                              >
                                {book.status === 'In Stock' ? <CheckCircle2 size={12} className="mr-1"/> : <AlertCircle size={12} className="mr-1"/>}
                                {book.status}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleDeleteBook(book.id)}
                                className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
                                title="Delete Book"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;