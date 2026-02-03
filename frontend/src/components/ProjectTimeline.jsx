import React, { useState, useEffect, useRef } from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  FlagIcon,
  ChatBubbleLeftRightIcon,
  PlusCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const ProjectTimeline = ({ workspaceId, userRole }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const timelineRef = useRef(null);

  useEffect(() => {
    if (workspaceId) {
      fetchTimeline();
    }
  }, [workspaceId, filter]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `/api/workspaces/${workspaceId}/timeline?limit=50`;
      if (filter !== 'all') {
        url += `&types=${filter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data);
        setHasMore(data.hasMore || false);
      } else {
        toast.error('Failed to load timeline');
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
      toast.error('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    
    if (!noteTitle.trim()) {
      toast.error('Please enter a note title');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/workspaces/${workspaceId}/timeline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'note.added',
          title: noteTitle,
          description: noteDescription,
          metadata: {
            addedBy: userRole
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Note added to timeline');
        setNoteTitle('');
        setNoteDescription('');
        setShowAddNote(false);
        fetchTimeline(); // Refresh timeline
      } else {
        toast.error(data.message || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const getEventIcon = (type) => {
    const iconProps = { className: "w-5 h-5" };
    
    if (type.startsWith('milestone')) {
      return <FlagIcon {...iconProps} />;
    } else if (type.startsWith('deliverable')) {
      return <DocumentTextIcon {...iconProps} />;
    } else if (type.startsWith('payment') || type.startsWith('escrow')) {
      return <CurrencyRupeeIcon {...iconProps} />;
    } else if (type.includes('approved')) {
      return <CheckCircleIcon {...iconProps} />;
    } else if (type.includes('rejected') || type.includes('revised')) {
      return <XCircleIcon {...iconProps} />;
    } else if (type === 'note.added') {
      return <ChatBubbleLeftRightIcon {...iconProps} />;
    } else {
      return <ClockIcon {...iconProps} />;
    }
  };

  const getEventColor = (type) => {
    if (type.includes('approved') || type.includes('completed') || type === 'payment.completed') {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'bg-green-100 text-green-600',
        dot: 'bg-green-500'
      };
    } else if (type.includes('rejected') || type.includes('failed')) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'bg-red-100 text-red-600',
        dot: 'bg-red-500'
      };
    } else if (type.includes('revised') || type.includes('revision')) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: 'bg-amber-100 text-amber-600',
        dot: 'bg-amber-500'
      };
    } else if (type.startsWith('payment') || type.startsWith('escrow')) {
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: 'bg-emerald-100 text-emerald-600',
        dot: 'bg-emerald-500'
      };
    } else if (type.startsWith('milestone')) {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'bg-blue-100 text-blue-600',
        dot: 'bg-blue-500'
      };
    } else if (type.startsWith('deliverable')) {
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'bg-purple-100 text-purple-600',
        dot: 'bg-purple-500'
      };
    } else if (type === 'note.added') {
      return {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        icon: 'bg-indigo-100 text-indigo-600',
        dot: 'bg-indigo-500'
      };
    } else {
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        icon: 'bg-gray-100 text-gray-600',
        dot: 'bg-gray-400'
      };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getDateHeader = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if ((now - date) < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const dateHeader = getDateHeader(event.createdAt);
    if (!groups[dateHeader]) {
      groups[dateHeader] = [];
    }
    groups[dateHeader].push(event);
    return groups;
  }, {});

  const filters = [
    { id: 'all', label: 'All Events', icon: ClockIcon },
    { id: 'milestone.created,milestone.approved,milestone.rejected', label: 'Milestones', icon: FlagIcon },
    { id: 'deliverable.submitted,deliverable.approved,deliverable.revised', label: 'Deliverables', icon: DocumentTextIcon },
    { id: 'payment.completed,escrow.funded', label: 'Payments', icon: CurrencyRupeeIcon },
    { id: 'note.added', label: 'Notes', icon: ChatBubbleLeftRightIcon }
  ];

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header with filters and add note button */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Project Timeline</h3>
          <button
            onClick={() => setShowAddNote(!showAddNote)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircleIcon className="w-4 h-4" />
            Add Note
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map(f => {
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add note form */}
      {showAddNote && (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-4">
          <form onSubmit={handleAddNote} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Note title..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={submitting}
              />
            </div>
            <div>
              <textarea
                placeholder="Add details (optional)..."
                value={noteDescription}
                onChange={(e) => setNoteDescription(e.target.value)}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                disabled={submitting}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting || !noteTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Adding...' : 'Add to Timeline'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddNote(false);
                  setNoteTitle('');
                  setNoteDescription('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline content - scrollable */}
      <div ref={timelineRef} className="flex-1 overflow-y-auto px-4 py-4">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No events yet</p>
            <p className="text-sm text-gray-400">Timeline events will appear here as the project progresses</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([dateHeader, dateEvents]) => (
              <div key={dateHeader}>
                {/* Date header */}
                <div className="sticky top-0 bg-gray-50 py-2 mb-4 z-10">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {dateHeader}
                  </h4>
                </div>

                {/* Events for this date */}
                <div className="relative space-y-4 pl-8">
                  {/* Vertical line */}
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                  {dateEvents.map((event, index) => {
                    const colors = getEventColor(event.type);
                    const Icon = getEventIcon(event.type);

                    return (
                      <div key={event._id || `event-${index}`} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-6 top-3 w-3 h-3 rounded-full ${colors.dot} border-2 border-white shadow-sm`}></div>

                        {/* Event card */}
                        <div className={`${colors.bg} border ${colors.border} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}>
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-10 h-10 ${colors.icon} rounded-lg flex items-center justify-center`}>
                              {Icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h5 className="font-semibold text-gray-900 text-sm leading-tight">
                                  {event.title}
                                </h5>
                                <span className="flex-shrink-0 text-xs text-gray-500">
                                  {formatDate(event.createdAt)}
                                </span>
                              </div>

                              {event.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {event.description}
                                </p>
                              )}

                              {/* Actor info */}
                              {event.actor && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                  {event.actor.profilePicture ? (
                                    <img 
                                      src={event.actor.profilePicture} 
                                      alt={event.actor.fullName}
                                      className="w-5 h-5 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                                      {event.actor.fullName?.[0]?.toUpperCase()}
                                    </div>
                                  )}
                                  <span>{event.actor.fullName}</span>
                                </div>
                              )}

                              {/* Source badge */}
                              {event.source === 'stored' && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                    Custom Note
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="text-center py-4">
            <button
              onClick={fetchTimeline}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Load more events
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTimeline;
