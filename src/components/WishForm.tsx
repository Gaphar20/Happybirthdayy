import React, { useState } from 'react';
import { Send, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitWish } from '../firebase/wishes';
import { Wish } from '../types';

interface WishFormProps {
  onWishSubmitted: (newWish?: Wish) => void;
}

export const WishForm: React.FC<WishFormProps> = ({ onWishSubmitted }) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Family');
  const [customRelationship, setCustomRelationship] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const relationshipOptions = [
    'Son',
    'Daughter',
    'Wife',
    'Grandchild',
    'Sister',
    'Brother',
    'Family Member',
    'Lifelong Friend',
    'Colleague',
    'Community Well-wisher',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your full name.' });
      return;
    }
    if (!message.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please write your birthday message and prayers for Dad.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const finalRelationship =
      relationship === 'Other' && customRelationship.trim()
        ? customRelationship.trim()
        : relationship;

    try {
      const res = await submitWish({
        name: name.trim(),
        relationship: finalRelationship,
        message: message.trim(),
      });

      if (res.success) {
        // Trigger celebratory confetti burst
        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#c5a059', '#ffdea5', '#775a19', '#ffffff'],
          });
        } catch {
          // ignore if canvas blocked
        }

        setStatusMessage({
          type: 'success',
          text: 'Thank you! Your heartfelt birthday wish has been published to Dad’s tribute guestbook.',
        });

        setName('');
        setMessage('');
        setCustomRelationship('');
        setRelationship('Family');

        onWishSubmitted();
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Unable to submit your wish to the database. Please try again.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Unable to submit your wish right now. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl p-7 sm:p-9 shadow-sm border border-[#c5a059]/30 relative overflow-hidden"
    >
      <div className="flex items-center gap-2 text-xs font-bold text-[#775a19] uppercase tracking-widest mb-2">
        <Sparkles className="w-4 h-4" />
        <span>Guestbook Tribute</span>
      </div>

      <h3 className="font-serif text-2xl sm:text-3xl text-[#1c1c19] font-medium mb-3">
        Send Dad a Heartfelt Wish
      </h3>

      <p className="text-sm text-[#4e4639] mb-6 leading-relaxed">
        Your loving words and memories will be cherished by Dad and all who gather to celebrate his life and legacy.
      </p>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl mb-6 flex items-start gap-3 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-[#ffe088]/25 text-[#4e3700] border border-[#c5a059]/40'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#775a19] mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Name Input */}
        <div>
          <label
            htmlFor="wish-author-name"
            className="block text-xs font-semibold text-[#1c1c19] uppercase tracking-wider mb-2"
          >
            Your Full Name <span className="text-[#775a19]">*</span>
          </label>
          <input
            id="wish-author-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Tolu Idris or Dr. Funmilayo"
            className="w-full px-4 py-3 rounded-2xl bg-[#f6f3ee] border border-[#d1c5b4]/40 text-[#1c1c19] placeholder-[#7f7667] focus:outline-none focus:ring-2 focus:ring-[#775a19] focus:bg-white text-sm transition-all"
          />
        </div>

        {/* Relationship Selector */}
        <div>
          <label
            htmlFor="wish-relationship"
            className="block text-xs font-semibold text-[#1c1c19] uppercase tracking-wider mb-2"
          >
            Relationship to Dad <span className="text-[#7f7667] font-normal">(Optional)</span>
          </label>
          <select
            id="wish-relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#f6f3ee] border border-[#d1c5b4]/40 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#775a19] focus:bg-white text-sm transition-all"
          >
            {relationshipOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {relationship === 'Other' && (
          <div>
            <label
              htmlFor="custom-relationship-input"
              className="block text-xs font-semibold text-[#1c1c19] uppercase tracking-wider mb-2"
            >
              Specify Relationship
            </label>
            <input
              id="custom-relationship-input"
              type="text"
              value={customRelationship}
              onChange={(e) => setCustomRelationship(e.target.value)}
              placeholder="e.g. Niece, Mentee, Church Member"
              className="w-full px-4 py-3 rounded-2xl bg-[#f6f3ee] border border-[#d1c5b4]/40 text-[#1c1c19] text-sm focus:outline-none focus:ring-2 focus:ring-[#775a19]"
            />
          </div>
        )}

        {/* Message Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="wish-message-area"
              className="block text-xs font-semibold text-[#1c1c19] uppercase tracking-wider"
            >
              Your Birthday Message <span className="text-[#775a19]">*</span>
            </label>
            <span className="text-[11px] text-[#7f7667]">
              {message.length}/1000
            </span>
          </div>
          <textarea
            id="wish-message-area"
            required
            rows={4}
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your prayers, warm memories, and blessings for Alhaji Idris on his September 19 birthday..."
            className="w-full px-4 py-3 rounded-2xl bg-[#f6f3ee] border border-[#d1c5b4]/40 text-[#1c1c19] placeholder-[#7f7667] focus:outline-none focus:ring-2 focus:ring-[#775a19] focus:bg-white text-sm transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-4 px-6 rounded-full bg-[#31302d] hover:bg-[#775a19] text-[#f3f0eb] hover:text-white transition-all duration-300 font-semibold text-sm uppercase tracking-wider shadow-md hover:shadow-lg flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#c5a059]" />
              <span>Submitting Wish to Firestore...</span>
            </>
          ) : (
            <>
              <span>Send Birthday Wish</span>
              <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
