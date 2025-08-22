import React, { useState } from 'react';
import { ArrowLeft, Star, Send, CheckCircle, MessageSquare, Volume2, User, Briefcase, Heart, Zap, Clock, Globe, Mic, X } from 'lucide-react';
import { Voice, Language } from '../types';
import { GoogleSheetsService } from '../services/googleSheetsService';

interface FeedbackPageProps {
  voice: Voice;
  language: Language;
  onBack: () => void;
  onComplete: () => void;
}

interface AttributeRating {
  rating: number;
  comment: string;
}

export function FeedbackPage({ voice, language, onBack, onComplete }: FeedbackPageProps) {
  const [overallRating, setOverallRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [generalFeedback, setGeneralFeedback] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('');
  const [attributeRatings, setAttributeRatings] = useState<Record<string, AttributeRating>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const googleSheetsService = GoogleSheetsService.getInstance();

  const feedbackAttributes = [
    { 
      id: 'voice_quality', 
      label: 'Voice Quality', 
      icon: Volume2,
      description: 'Overall audio clarity and sound quality'
    },
    { 
      id: 'naturalness', 
      label: 'Naturalness', 
      icon: User,
      description: 'How human-like and natural the voice sounds'
    },
    { 
      id: 'pronunciation', 
      label: 'Pronunciation', 
      icon: MessageSquare,
      description: 'Accuracy of word pronunciation and articulation'
    },
    { 
      id: 'emotional_expression', 
      label: 'Emotional Expression', 
      icon: Heart,
      description: 'Ability to convey emotions and tone appropriately'
    },
    { 
      id: 'professional_sounding', 
      label: 'Professional Sounding', 
      icon: Briefcase,
      description: 'Suitable for business and professional contexts'
    },
    { 
      id: 'engagement', 
      label: 'Engagement', 
      icon: Zap,
      description: 'How engaging and captivating the voice is'
    },
    { 
      id: 'pace_rhythm', 
      label: 'Pace & Rhythm', 
      icon: Clock,
      description: 'Speaking speed and natural flow of speech'
    },
    { 
      id: 'accent_clarity', 
      label: 'Accent Clarity', 
      icon: Globe,
      description: 'How clear and understandable the accent is'
    },
    { 
      id: 'consistency', 
      label: 'Consistency', 
      icon: Mic,
      description: 'Maintains consistent quality throughout'
    }
  ];

  const updateAttributeRating = (attributeId: string, rating: number) => {
    setAttributeRatings(prev => ({
      ...prev,
      [attributeId]: {
        ...prev[attributeId],
        rating
      }
    }));
  };

  const updateAttributeComment = (attributeId: string, comment: string) => {
    setAttributeRatings(prev => ({
      ...prev,
      [attributeId]: {
        rating: prev[attributeId]?.rating || 0,
        comment
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if overall rating is provided
    if (overallRating === 0) return;
    
    // Check if reviewer name is provided
    if (!reviewerName.trim()) return;
    
    // Check if all attributes have ratings
    const missingRatings = feedbackAttributes.filter(attr => 
      !attributeRatings[attr.id]?.rating || attributeRatings[attr.id].rating === 0
    );
    
    if (missingRatings.length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    
    // Prepare feedback data for Google Sheets
    const feedbackData = {
      reviewerName: reviewerName.trim(),
      voiceId: voice.voice_id,
      voiceName: voice.name,
      languageCode: language.code,
      languageName: language.name,
      overallRating,
      attributeRatings,
      generalFeedback,
      timestamp: new Date().toISOString()
    };

    try {
      // Submit to Google Sheets
      const success = await googleSheetsService.submitFeedback(feedbackData);
      
      console.log('Feedback submitted successfully to Google Sheets:', success);
      setIsSubmitted(true);
      
      // Auto-redirect after showing success message
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.';
      setSubmitError(errorMessage);
      return; // Don't set submitted state on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ 
    rating, 
    onRatingChange, 
    hoveredRating, 
    onHover, 
    onLeave, 
    size = 'h-6 w-6' 
  }: {
    rating: number;
    onRatingChange: (rating: number) => void;
    hoveredRating?: number;
    onHover?: (rating: number) => void;
    onLeave?: () => void;
    size?: string;
  }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => onHover?.(star)}
          onMouseLeave={onLeave}
          className="p-1 transition-colors"
        >
          <Star
            className={`${size} ${
              star <= (hoveredRating || rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your detailed feedback has been submitted successfully. It helps us improve our voice technology.
          </p>
          <div className="text-sm text-gray-500">
            Redirecting you back to voice selection...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Conversation
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Voice Feedback</h1>
            <p className="text-gray-600 mt-1">Help us improve by sharing your detailed experience</p>
          </div>
        </div>

        {/* Voice Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Volume2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{voice.name}</h3>
              <p className="text-gray-600">{language.flag} {language.name}</p>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <span>{voice.labels?.gender || voice.gender || 'N/A'}</span>
                <span>•</span>
                <span>{voice.labels?.age || voice.age || 'N/A'}</span>
                <span>•</span>
                <span>{voice.labels?.accent || voice.accent || 'Neutral'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Error Message */}
          {submitError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <div className="flex-1">
                <p className="text-red-800 text-sm">{submitError}</p>
              </div>
              <button
                onClick={() => setSubmitError(null)}
                className="ml-3 text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Reviewer Name */}
            <div>
              <label htmlFor="reviewerName" className="block text-xl font-bold text-gray-900 mb-4">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="reviewerName"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {!reviewerName.trim() && (
                <p className="mt-2 text-sm text-red-500">Name is required</p>
              )}
            </div>

            {/* Overall Rating */}
            <div>
              <label className="block text-xl font-bold text-gray-900 mb-4">
                Overall Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-4">
                <StarRating
                  rating={overallRating}
                  onRatingChange={setOverallRating}
                  hoveredRating={hoveredRating}
                  onHover={setHoveredRating}
                  onLeave={() => setHoveredRating(0)}
                  size="h-8 w-8"
                />
                <span className="text-gray-600 font-medium">
                  {overallRating > 0 && (
                    <>
                      {overallRating === 1 && 'Poor'}
                      {overallRating === 2 && 'Fair'}
                      {overallRating === 3 && 'Good'}
                      {overallRating === 4 && 'Very Good'}
                      {overallRating === 5 && 'Excellent'}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Detailed Attribute Ratings */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Detailed Ratings <span className="text-red-500">*</span>
              </h3>
              <p className="text-gray-600 mb-6">
                Please rate all aspects of the voice. Comments are optional but help us understand your experience better.
              </p>
              
              <div className="space-y-8">
                {feedbackAttributes.map((attribute) => {
                  const Icon = attribute.icon;
                  const currentRating = attributeRatings[attribute.id]?.rating || 0;
                  const currentComment = attributeRatings[attribute.id]?.comment || '';
                  
                  return (
                    <div key={attribute.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {attribute.label} <span className="text-red-500">*</span>
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            {attribute.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 mb-4">
                            <StarRating
                              rating={currentRating}
                              onRatingChange={(rating) => updateAttributeRating(attribute.id, rating)}
                            />
                            {currentRating > 0 && (
                              <span className="text-sm text-gray-600">
                                {currentRating === 1 && 'Poor'}
                                {currentRating === 2 && 'Fair'}
                                {currentRating === 3 && 'Good'}
                                {currentRating === 4 && 'Very Good'}
                                {currentRating === 5 && 'Excellent'}
                              </span>
                            )}
                            {currentRating === 0 && (
                              <span className="text-sm text-red-500">
                                Rating required
                              </span>
                            )}
                          </div>
                          
                          <textarea
                            value={currentComment}
                            onChange={(e) => updateAttributeComment(attribute.id, e.target.value)}
                            placeholder={`Share your thoughts about ${attribute.label.toLowerCase()}...`}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* General Comments */}
            <div>
              <label htmlFor="generalFeedback" className="block text-xl font-bold text-gray-900 mb-4">
                Additional Comments (Optional)
              </label>
              <p className="text-gray-600 mb-4">
                Share any other thoughts, suggestions, or experiences with this voice.
              </p>
              <textarea
                id="generalFeedback"
                value={generalFeedback}
                onChange={(e) => setGeneralFeedback(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Tell us about your overall experience, any specific use cases you tested, or suggestions for improvement..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={
                  overallRating === 0 || 
                  !reviewerName.trim() ||
                  isSubmitting ||
                  feedbackAttributes.some(attr => 
                    !attributeRatings[attr.id]?.rating || attributeRatings[attr.id].rating === 0
                  )
                }
                className="flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:transform-none disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Submit Detailed Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <span className="text-red-500">*</span> Required fields. Your feedback helps us improve our voice technology for everyone.
          <br />
          Please complete all ratings. Comments are optional but appreciated.
        </div>
      </div>
    </div>
  );
}