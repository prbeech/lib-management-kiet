import React from 'react';
import { Book } from '../types';
import { Star, BookOpen } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  return (
    <div 
      onClick={() => onClick(book)}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 cursor-pointer flex flex-col h-full transform hover:-translate-y-1"
    >
      <div className="relative h-48 overflow-hidden bg-slate-200">
        <img 
          src={book.coverUrl} 
          alt={book.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold shadow-sm">
          {book.genre}
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 line-clamp-1">{book.title}</h3>
        <p className="text-slate-500 text-sm mb-3">{book.author}</p>
        
        <div className="flex items-center space-x-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={14} 
              className={`${i < Math.floor(book.rating) ? 'text-yellow-400 fill-current' : 'text-slate-200'}`} 
            />
          ))}
          <span className="text-xs text-slate-400 ml-1">({book.rating})</span>
        </div>

        <div className="mt-auto flex justify-between items-center pt-3 border-t border-slate-50">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            book.status === 'In Stock' 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-rose-100 text-rose-700'
          }`}>
            {book.status}
          </span>
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Details <BookOpen size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
