# Visable - Development Documentation

## Project Overview

Visable is a comprehensive job-seeking platform designed specifically for international students in the US. The platform integrates job listings, community forums, career insights, and document management to create a complete ecosystem for job seekers, with a focus on H-1B visa sponsorship opportunities.

## System Architecture

### Frontend
- **Framework**: React with functional components and hooks
- **State Management**: React Context API and local component state
- **Routing**: React Router v6
- **Styling**: SCSS modules with custom variables system
- **UI Components**: Mix of custom components and Ant Design

### Backend
- **Database & Auth**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Realtime**: Supabase Realtime for chat and notifications
- **Functions**: Supabase Edge Functions

### Deployment
- **Hosting**: Netlify
- **Database**: Supabase Cloud
- **CI/CD**: GitHub Actions

## Database Schema

### Core Tables

#### users
- Extended from `auth.users` for public profile data
- Contains profile information and preferences
- Key fields: `id`, `email`, `full_name`, `bio`, `website`, `location`, `vpoint`, `resume`, `cover_letter`

#### boards
- Represents discussion boards/communities
- Key fields: `id`, `name`, `description`, `created_at`, `is_private`, `created_by`

#### posts
- Contains all user posts (regular and career insights)
- Key fields: `id`, `user_id`, `board_id`, `board_name`, `title`, `content`, `is_anonymous`, `category`, `created_at`, `is_archived`
- Career insights have additional fields: `company_name`, `job_title`, `location`, `base_salary`

#### comments
- User comments on posts
- Key fields: `id`, `post_id`, `user_id`, `content`, `created_at`

#### jobs
- H-1B job listings
- Key fields: `id`, `job_id`, `job_position`, `company_name`, `job_location`, `job_posting_date`, `job_description`, `company_logo_url`, `company_profile`, `job_link`

#### saved_jobs
- User bookmarks for jobs
- Key fields: `id`, `user_id`, `job_id`, `created_at`

### Chat System Tables

#### chat_rooms
- Stores different chat room types (direct, group, board)
- Key fields: `id`, `name`, `type`, `board_id`, `created_at`, `created_by`

#### chat_participants
- Links users to chat rooms
- Key fields: `id`, `chat_room_id`, `user_id`, `user_email`, `role`, `joined_at`, `status`

#### chat_messages
- Stores all chat messages
- Key fields: `id`, `chat_room_id`, `sender_id`, `sender_email`, `message`, `created_at`, `is_system`

### Additional Tables

#### vpoint_transactions
- Records vpoint earning and spending
- Key fields: `id`, `user_id`, `amount`, `type`, `description`, `related_id`, `created_at`

#### user_preferences
- Stores user settings including language preferences
- Key fields: `id`, `user_id`, `language`, `created_at`

## Key Features

### Authentication System
- Google OAuth integration
- Account creation trigger to sync auth.users to public.users
- Session management and persistence

### Discussion Boards
- Public and private boards
- Anonymous posting option
- Post voting and commenting
- Content archiving functionality

### Job Search
- H-1B focused job listings
- Advanced search and filtering
- Job saving functionality
- Application tracking

### Career Insights
- Salary sharing and company reviews
- Anonymous career insights
- Searchable by company, position, location

### Chat System
- Direct messaging
- Group chats
- Board-based community chats
- Real-time message delivery
- Participant management
- Message persistence

### Document Management
- Resume storage and management
- Cover letter storage and management
- File versioning

### User Dashboard
- Saved jobs
- Post history
- Career insights
- Document management

## Frontend Structure

### Page Components
- **HomePage**: Landing page with post feed and sidebar
- **BoardPage**: Discussion board view with posts and board details
- **PostDetailPage**: Single post view with comments
- **JobsPage**: Job listings with search and filters
- **CareerInsightPage**: Career insights and salary information
- **ExperiencePage**: User experiences and testimonials
- **AccountPage**: Container for user-related subpages
  - **ProfilePage**: User profile management
  - **DocumentsPage**: Resume and cover letter management
  - **SavedJobsPage**: Bookmarked jobs
  - **UserPostsPage**: User's post history
  - **UserCareerInsightsPage**: User's career insights
  - **MessagesPage**: Chat conversations management

### Layout Components
- **MainLayout**: Overall page structure with navbar and sidebar
- **Navbar**: Top navigation with search, user menu, messaging
- **Sidebar**: Left navigation with boards and categories

### Feature Components
- **CreatePostModal**: Modal for creating/editing posts
- **ChatModal**: Floating chat interface
- **BoardSidebar**: Board information and actions
- **PostCard**: Reusable post preview component
- **JobCard**: Job listing card component
- **FilterButton**: Search filter UI component
- **AuthPopup**: Authentication modal

## API Integrations

### Job Data API
- Fetches H-1B job listings
- Transforms and stores job data in the database
- Scheduled updates for fresh data

### Google OAuth
- Handles user authentication flow
- Retrieves user profile information

### (Optional) Google Translate API
- Provides translation services for multilingual support

## Row-Level Security Policies

### Posts Policies
- Anyone can view public posts
- Only post authors can edit their own non-archived posts
- Only post authors can archive their own posts

### Comments Policies
- Anyone can view comments
- Only comment authors can delete their own comments
- No comments allowed on archived posts

### Jobs Policies
- Jobs data is readable by all
- No insert/update/delete allowed by users

### Saved Jobs Policies
- Users can only view/add/delete their own saved jobs

### Boards Policies
- All users can view public boards
- Only board creators and admins can edit boards

### Chat Policies
- Board chats visible to all users
- Direct and group chats visible only to participants
- Messages visible only to chat participants
- Non-recursive policies to prevent infinite recursion

## Challenges and Solutions

### Chat System Infinite Recursion
- **Problem**: RLS policies caused infinite recursion in chat queries
- **Solution**: Redesigned policies to use non-recursive approaches with IN clauses instead of EXISTS checks

### User Data Preservation
- **Problem**: Deleted user accounts broke references in chat and posts
- **Solution**: Added email capture on insert and SET NULL on delete for user references

### Message Delivery
- **Problem**: Ensuring real-time message delivery
- **Solution**: Implemented Supabase Realtime subscriptions for immediate updates

## Performance Optimizations

### Database Indexing
- Added indexes on frequently queried fields: `user_id`, `post_id`, `chat_room_id`
- Created composite indexes for unique constraints and common query patterns

### Query Optimization
- Used `select('*')` sparingly, preferring explicit column selection
- Added caching for frequently accessed static data
- Implemented pagination for posts and jobs listings

### Frontend Optimizations
- Lazy loading for routes using React.lazy()
- Image optimization for job logos and user avatars
- Virtualization for long lists where appropriate

## Security Considerations

### Row Level Security
- Comprehensive RLS policies to protect user data
- SQL injection protection via parameterized queries
- Proper constraints to maintain data integrity

### Authentication
- Token-based auth with JWT
- Secure credential handling via OAuth
- Protection against CSRF attacks

### Data Validation
- Input validation on both client and server
- File upload restrictions (size, type) for documents

## Deployment Process

### Development Environment
- Local Supabase instance for development
- Environment variables for API keys and endpoints
- Hot reload configuration for efficient development

### Production Deployment
- Netlify deployment connected to GitHub repository
- Supabase production project for database
- Environment variable management for sensitive data

## Future Enhancements

### Planned Features
- Advanced analytics for user engagement
- Premium membership tiers
- Mobile application
- AI-powered job matching
- Content recommendation engine
- Language translation for international users

### Technical Improvements
- Server-side rendering for improved SEO
- Test automation for critical paths
- Performance monitoring and alerting
- Database optimization and sharding for scale

## Maintenance Tips

### Common Issues
- Chat policy recursion issues - check fix_chat_recursion.sql
- User permission conflicts - verify RLS policies
- Real-time subscription disconnects - implement reconnection logic

### Regular Maintenance
- Database backups and monitoring
- JWT token rotation
- Job data refresh mechanism
- API key rotation
- Security audits

## Development Workflow

### Local Development
1. Run Supabase local instance
2. Start development server with `npm run dev`
3. Test changes with local database
4. Commit to feature branch

### Testing
1. Run unit tests with `npm test`
2. Perform manual testing on critical paths
3. Verify mobile responsiveness

### Deployment
1. Merge feature branch to main
2. Netlify auto-deploys from main branch
3. Run database migrations on Supabase
4. Verify production deployment

## Conclusion

The Visable platform provides a comprehensive solution for international students seeking employment with H-1B sponsorship in the US. Its integrated approach combining job listings, community forums, career insights, and user tools creates a unique ecosystem for job seekers. The modular architecture allows for future expansion and feature enhancements while maintaining performance and security.

This document serves as a reference for understanding the system architecture, database schema, features, and development considerations. It should be updated as the system evolves and new features are implemented.



post 設計
create post 要分兩頁 第一頁先選 post type
如果選 career insight 下一頁 再選 salary or interview (這頁可以返回上一頁選擇 post type)

如果選擇 salary 或者 interview (統稱 career insights ) 希望建立post的地方是在career insights page 的 maincontent

待開發
聊天功能 (儲存至 supabase)
job list im


<!-- chat modal 
chat modal 左邊可以選擇已已加入 的 group chat 或者 single chat 
流程是這樣 

找使用者 > 點 私信 > 觸發 modal 打開 > 可開始一對一傳訊息
找 board > 點 joint group chat > 觸發 modal 打開 > 可開始group chat
這些已經開啟的聊天室 都會出現在 chat modal 左邊 -->


<!-- 屬於論壇的文章現在 右邊有
About the Board
結構如下
About the Board
board infomation
group 總人數 | 在線人數
Create post button (按了直接開啟 create post)
Join group chat (目前功能) -->