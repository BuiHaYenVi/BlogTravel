--
-- PostgreSQL database dump
--

\restrict 2rAdNBNg5rWD4fbR5LfUJgldstZN8lwQ2FwH9EpI3gbDpOK0Y96nakv9iB1YKDy

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(255) NOT NULL,
    target_type character varying(50),
    target_id integer,
    details jsonb,
    status character varying(20) DEFAULT 'success'::character varying,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_notifications (
    id integer NOT NULL,
    type character varying(50) NOT NULL,
    data jsonb NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin_notifications OWNER TO postgres;

--
-- Name: admin_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_notifications_id_seq OWNER TO postgres;

--
-- Name: admin_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_notifications_id_seq OWNED BY public.admin_notifications.id;


--
-- Name: answer_helpful; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.answer_helpful (
    id integer NOT NULL,
    answer_id integer NOT NULL,
    user_id integer NOT NULL,
    is_helpful boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.answer_helpful OWNER TO postgres;

--
-- Name: answer_helpful_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.answer_helpful_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.answer_helpful_id_seq OWNER TO postgres;

--
-- Name: answer_helpful_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.answer_helpful_id_seq OWNED BY public.answer_helpful.id;


--
-- Name: answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.answers (
    id integer NOT NULL,
    question_id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    is_best_answer boolean DEFAULT false,
    helpful_count integer DEFAULT 0,
    not_helpful_count integer DEFAULT 0,
    images jsonb,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.answers OWNER TO postgres;

--
-- Name: answers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.answers_id_seq OWNER TO postgres;

--
-- Name: answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.answers_id_seq OWNED BY public.answers.id;


--
-- Name: blogs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blogs (
    id integer NOT NULL,
    author_id integer,
    title character varying(511) NOT NULL,
    content_html text NOT NULL,
    cover_image text,
    status character varying(50) DEFAULT 'published'::character varying,
    views_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    shared_from_id integer,
    shared_from_type character varying(20) DEFAULT 'blog'::character varying,
    share_count integer DEFAULT 0
);


ALTER TABLE public.blogs OWNER TO postgres;

--
-- Name: blogs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blogs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blogs_id_seq OWNER TO postgres;

--
-- Name: blogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blogs_id_seq OWNED BY public.blogs.id;


--
-- Name: chats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chats (
    id integer NOT NULL,
    user_one_id integer NOT NULL,
    user_two_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    last_message_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chats OWNER TO postgres;

--
-- Name: chats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chats_id_seq OWNER TO postgres;

--
-- Name: chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chats_id_seq OWNED BY public.chats.id;


--
-- Name: checkins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.checkins (
    id integer NOT NULL,
    user_id integer NOT NULL,
    destination_id integer CONSTRAINT checkins_location_id_not_null NOT NULL,
    post_id integer,
    note text,
    images jsonb,
    weather character varying(50),
    mood character varying(50),
    checked_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'visited'::character varying
);


ALTER TABLE public.checkins OWNER TO postgres;

--
-- Name: checkins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.checkins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.checkins_id_seq OWNER TO postgres;

--
-- Name: checkins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.checkins_id_seq OWNED BY public.checkins.id;


--
-- Name: comment_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_likes (
    id integer NOT NULL,
    comment_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.comment_likes OWNER TO postgres;

--
-- Name: comment_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comment_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comment_likes_id_seq OWNER TO postgres;

--
-- Name: comment_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comment_likes_id_seq OWNED BY public.comment_likes.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    parent_id integer,
    like_count integer DEFAULT 0,
    reply_count integer DEFAULT 0,
    is_edited boolean DEFAULT false,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: follows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.follows (
    id integer NOT NULL,
    follower_id integer NOT NULL,
    following_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.follows OWNER TO postgres;

--
-- Name: follows_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.follows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.follows_id_seq OWNER TO postgres;

--
-- Name: follows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.follows_id_seq OWNED BY public.follows.id;


--
-- Name: group_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_members (
    id integer NOT NULL,
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(50) DEFAULT 'member'::character varying,
    status character varying(50) DEFAULT 'active'::character varying,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    invited_by_id integer
);


ALTER TABLE public.group_members OWNER TO postgres;

--
-- Name: group_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.group_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_members_id_seq OWNER TO postgres;

--
-- Name: group_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.group_members_id_seq OWNED BY public.group_members.id;


--
-- Name: group_post_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_post_comments (
    id integer NOT NULL,
    group_post_id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    parent_id integer,
    like_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.group_post_comments OWNER TO postgres;

--
-- Name: group_post_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.group_post_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_post_comments_id_seq OWNER TO postgres;

--
-- Name: group_post_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.group_post_comments_id_seq OWNED BY public.group_post_comments.id;


--
-- Name: group_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_posts (
    id integer NOT NULL,
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(200),
    content text NOT NULL,
    images jsonb,
    like_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    is_pinned boolean DEFAULT false,
    is_announcement boolean DEFAULT false,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.group_posts OWNER TO postgres;

--
-- Name: group_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.group_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_posts_id_seq OWNER TO postgres;

--
-- Name: group_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.group_posts_id_seq OWNED BY public.group_posts.id;


--
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    cover_image text,
    owner_id integer NOT NULL,
    member_count integer DEFAULT 1,
    post_count integer DEFAULT 0,
    is_private boolean DEFAULT false,
    is_active boolean DEFAULT true,
    rules text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    location character varying(255),
    max_members integer,
    start_date date,
    end_date date,
    category character varying(100) DEFAULT 'General'::character varying
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.groups_id_seq OWNER TO postgres;

--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- Name: likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.likes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    post_id integer,
    comment_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    group_post_id integer,
    CONSTRAINT check_like_target CHECK ((((post_id IS NOT NULL) AND (comment_id IS NULL) AND (group_post_id IS NULL)) OR ((post_id IS NULL) AND (comment_id IS NOT NULL) AND (group_post_id IS NULL)) OR ((post_id IS NULL) AND (comment_id IS NULL) AND (group_post_id IS NOT NULL))))
);


ALTER TABLE public.likes OWNER TO postgres;

--
-- Name: likes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.likes_id_seq OWNER TO postgres;

--
-- Name: likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.likes_id_seq OWNED BY public.likes.id;


--
-- Name: location_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.location_tags (
    location_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE public.location_tags OWNER TO postgres;

--
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    type character varying(50) DEFAULT 'province'::character varying,
    parent_id integer,
    description text,
    short_desc character varying(300),
    image character varying(255),
    gallery jsonb,
    lat numeric(10,8),
    lng numeric(11,8),
    region character varying(50) DEFAULT 'mien-trung'::character varying,
    address character varying(255),
    phone character varying(20),
    website character varying(255),
    opening_hours character varying(100),
    price_range character varying(10) DEFAULT '$$'::character varying,
    view_count integer DEFAULT 0,
    review_count integer DEFAULT 0,
    average_rating numeric(2,1) DEFAULT 0,
    is_featured boolean DEFAULT false,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    travel_tips jsonb
);


ALTER TABLE public.locations OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.locations_id_seq OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer NOT NULL,
    message_text text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(50) NOT NULL,
    actor_id integer NOT NULL,
    target_type character varying(50) NOT NULL,
    target_id integer NOT NULL,
    content text,
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    custom_message text,
    redirect_url character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_resets (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    otp_code character varying(5) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    attempts integer DEFAULT 0,
    blocked_until timestamp without time zone,
    lockout_count integer DEFAULT 0
);


ALTER TABLE public.password_resets OWNER TO postgres;

--
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_resets_id_seq OWNER TO postgres;

--
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL,
    description character varying(255),
    module character varying(50) DEFAULT 'system'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plans (
    id integer NOT NULL,
    user_id integer,
    title character varying(255) NOT NULL,
    destination character varying(255),
    destination_id character varying(100),
    description text,
    cover_image text,
    start_date date,
    end_date date,
    budget numeric(15,2),
    total_days integer,
    status character varying(50) DEFAULT 'draft'::character varying,
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.plans OWNER TO postgres;

--
-- Name: plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plans_id_seq OWNER TO postgres;

--
-- Name: plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plans_id_seq OWNED BY public.plans.id;


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_likes (
    id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.post_likes OWNER TO postgres;

--
-- Name: post_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_likes_id_seq OWNER TO postgres;

--
-- Name: post_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_likes_id_seq OWNED BY public.post_likes.id;


--
-- Name: post_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_media (
    id integer NOT NULL,
    post_id integer NOT NULL,
    url character varying(255) NOT NULL,
    type character varying(50) DEFAULT 'image'::character varying,
    mime_type character varying(50),
    file_size integer,
    caption character varying(255),
    alt_text character varying(255),
    order_index integer DEFAULT 0,
    width integer,
    height integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.post_media OWNER TO postgres;

--
-- Name: post_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_media_id_seq OWNER TO postgres;

--
-- Name: post_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_media_id_seq OWNED BY public.post_media.id;


--
-- Name: post_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_tags (
    post_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE public.post_tags OWNER TO postgres;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(200) NOT NULL,
    slug character varying(255),
    content text NOT NULL,
    short_intro character varying(500),
    cover_image character varying(255),
    location_id integer,
    trip_id integer,
    post_type character varying(50) DEFAULT 'blog'::character varying,
    status character varying(20) DEFAULT 'draft'::character varying,
    start_date date,
    end_date date,
    duration_days integer,
    budget numeric(12,2),
    currency character varying(10) DEFAULT 'VND'::character varying,
    view_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    share_count integer DEFAULT 0,
    save_count integer DEFAULT 0,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    meta_title character varying(200),
    meta_description character varying(300),
    is_featured boolean DEFAULT false,
    published_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    group_id integer,
    shared_from_id integer,
    shared_from_type character varying(20) DEFAULT 'post'::character varying,
    is_approved boolean DEFAULT true
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_id_seq OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: question_followers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_followers (
    question_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.question_followers OWNER TO postgres;

--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    location_id integer,
    view_count integer DEFAULT 0,
    answer_count integer DEFAULT 0,
    follow_count integer DEFAULT 0,
    best_answer_id integer,
    status character varying(20) DEFAULT 'open'::character varying,
    is_featured boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.questions_id_seq OWNER TO postgres;

--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    reporter_id integer NOT NULL,
    reportable_type character varying(50) NOT NULL,
    reportable_id integer NOT NULL,
    reason character varying(50) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'pending'::character varying,
    admin_id integer,
    admin_note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_id_seq OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: review_helpful; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_helpful (
    id integer NOT NULL,
    review_id integer NOT NULL,
    user_id integer NOT NULL,
    is_helpful boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.review_helpful OWNER TO postgres;

--
-- Name: review_helpful_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.review_helpful_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_helpful_id_seq OWNER TO postgres;

--
-- Name: review_helpful_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.review_helpful_id_seq OWNED BY public.review_helpful.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    user_id integer NOT NULL,
    location_id integer NOT NULL,
    rating numeric(2,1),
    title character varying(150),
    content text,
    visit_date date,
    pros text,
    cons text,
    helpful_count integer DEFAULT 0,
    not_helpful_count integer DEFAULT 0,
    images jsonb,
    status character varying(20) DEFAULT 'pending'::character varying,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (((rating >= (1)::numeric) AND (rating <= (5)::numeric)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL,
    description character varying(255),
    level integer DEFAULT 0,
    color character varying(20) DEFAULT '#6c757d'::character varying,
    is_system boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: search_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.search_logs (
    id integer NOT NULL,
    user_id integer,
    keyword character varying(150) NOT NULL,
    search_type character varying(50) DEFAULT 'all'::character varying,
    filters jsonb,
    results_count integer DEFAULT 0,
    clicked_result_id integer,
    ip_address character varying(45),
    user_agent character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.search_logs OWNER TO postgres;

--
-- Name: search_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.search_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.search_logs_id_seq OWNER TO postgres;

--
-- Name: search_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.search_logs_id_seq OWNED BY public.search_logs.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value text,
    setting_type character varying(20) DEFAULT 'string'::character varying,
    description character varying(255),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_id_seq OWNER TO postgres;

--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: stories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stories (
    id integer NOT NULL,
    user_id integer,
    media_url character varying(512) NOT NULL,
    media_type character varying(20) NOT NULL,
    caption character varying(256),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP + '24:00:00'::interval),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false,
    file_cleaned boolean DEFAULT false
);


ALTER TABLE public.stories OWNER TO postgres;

--
-- Name: stories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stories_id_seq OWNER TO postgres;

--
-- Name: stories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stories_id_seq OWNED BY public.stories.id;


--
-- Name: story_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.story_likes (
    id integer NOT NULL,
    story_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.story_likes OWNER TO postgres;

--
-- Name: story_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.story_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.story_likes_id_seq OWNER TO postgres;

--
-- Name: story_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.story_likes_id_seq OWNED BY public.story_likes.id;


--
-- Name: tag_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tag_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    icon character varying(100) DEFAULT 'Compass'::character varying,
    color character varying(100) DEFAULT 'from-slate-400 to-slate-500'::character varying,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tag_categories OWNER TO postgres;

--
-- Name: tag_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tag_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tag_categories_id_seq OWNER TO postgres;

--
-- Name: tag_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tag_categories_id_seq OWNED BY public.tag_categories.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL,
    type character varying(50) DEFAULT 'topic'::character varying,
    description character varying(255),
    post_count integer DEFAULT 0,
    is_trending boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    category_id integer
);


ALTER TABLE public.tags OWNER TO postgres;

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tags_id_seq OWNER TO postgres;

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: trip_days; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trip_days (
    id integer NOT NULL,
    trip_id integer NOT NULL,
    day_number integer NOT NULL,
    date date,
    activities jsonb DEFAULT '[]'::jsonb,
    budget numeric(15,2) DEFAULT 0,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.trip_days OWNER TO postgres;

--
-- Name: trip_days_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trip_days_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trip_days_id_seq OWNER TO postgres;

--
-- Name: trip_days_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trip_days_id_seq OWNED BY public.trip_days.id;


--
-- Name: trip_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trip_participants (
    id integer NOT NULL,
    trip_id integer NOT NULL,
    user_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    role character varying(20) DEFAULT 'member'::character varying,
    note text,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    responded_at timestamp without time zone
);


ALTER TABLE public.trip_participants OWNER TO postgres;

--
-- Name: trip_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trip_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trip_participants_id_seq OWNER TO postgres;

--
-- Name: trip_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trip_participants_id_seq OWNED BY public.trip_participants.id;


--
-- Name: trip_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trip_tags (
    trip_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE public.trip_tags OWNER TO postgres;

--
-- Name: trips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trips (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    destination_id integer,
    location character varying(255),
    start_date date,
    end_date date,
    budget numeric(15,2) DEFAULT 0,
    category_tag character varying(255),
    max_members integer DEFAULT 2,
    current_members integer DEFAULT 1,
    status character varying(20) DEFAULT 'planning'::character varying,
    trip_type character varying(50) DEFAULT 'companion'::character varying,
    is_public boolean DEFAULT true,
    itinerary jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.trips OWNER TO postgres;

--
-- Name: trips_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trips_id_seq OWNER TO postgres;

--
-- Name: trips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trips_id_seq OWNED BY public.trips.id;


--
-- Name: user_hidden_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_hidden_comments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    comment_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_hidden_comments OWNER TO postgres;

--
-- Name: user_hidden_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_hidden_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_hidden_comments_id_seq OWNER TO postgres;

--
-- Name: user_hidden_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_hidden_comments_id_seq OWNED BY public.user_hidden_comments.id;


--
-- Name: user_interests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_interests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    tag_id integer NOT NULL,
    score numeric(3,2) DEFAULT 1.0,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_interests OWNER TO postgres;

--
-- Name: user_interests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_interests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_interests_id_seq OWNER TO postgres;

--
-- Name: user_interests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_interests_id_seq OWNED BY public.user_interests.id;


--
-- Name: user_role_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_role_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    old_role_id integer,
    new_role_id integer NOT NULL,
    changed_by integer NOT NULL,
    reason character varying(255),
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_role_logs OWNER TO postgres;

--
-- Name: user_role_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_role_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_role_logs_id_seq OWNER TO postgres;

--
-- Name: user_role_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_role_logs_id_seq OWNED BY public.user_role_logs.id;


--
-- Name: user_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    device_info character varying(255),
    ip_address character varying(45),
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_tokens OWNER TO postgres;

--
-- Name: user_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_tokens_id_seq OWNER TO postgres;

--
-- Name: user_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_tokens_id_seq OWNED BY public.user_tokens.id;


--
-- Name: user_visited; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_visited (
    id integer NOT NULL,
    user_id integer NOT NULL,
    location_id integer NOT NULL,
    visited_date date,
    rating numeric(2,1),
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_visited OWNER TO postgres;

--
-- Name: user_visited_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_visited_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_visited_id_seq OWNER TO postgres;

--
-- Name: user_visited_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_visited_id_seq OWNED BY public.user_visited.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(100),
    avatar character varying(255) DEFAULT 'default-avatar.png'::character varying,
    bio text,
    hometown character varying(100),
    dob date,
    gender character varying(20) DEFAULT 'other'::character varying,
    phone character varying(20),
    role_id integer DEFAULT 5,
    status character varying(20) DEFAULT 'pending'::character varying,
    reset_token character varying(100),
    reset_expires timestamp without time zone,
    email_verified_at timestamp without time zone,
    last_login_at timestamp without time zone,
    last_login_ip character varying(45),
    post_count integer DEFAULT 0,
    follower_count integer DEFAULT 0,
    following_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reset_token_expires timestamp without time zone,
    is_verified boolean DEFAULT false,
    interests text,
    current_city character varying(255),
    education_school character varying(255),
    workplace character varying(255),
    badge_title character varying(255) DEFAULT NULL::character varying,
    auth_provider character varying(50) DEFAULT 'local'::character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: admin_notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications ALTER COLUMN id SET DEFAULT nextval('public.admin_notifications_id_seq'::regclass);


--
-- Name: answer_helpful id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answer_helpful ALTER COLUMN id SET DEFAULT nextval('public.answer_helpful_id_seq'::regclass);


--
-- Name: answers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers ALTER COLUMN id SET DEFAULT nextval('public.answers_id_seq'::regclass);


--
-- Name: blogs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs ALTER COLUMN id SET DEFAULT nextval('public.blogs_id_seq'::regclass);


--
-- Name: chats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats ALTER COLUMN id SET DEFAULT nextval('public.chats_id_seq'::regclass);


--
-- Name: checkins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkins ALTER COLUMN id SET DEFAULT nextval('public.checkins_id_seq'::regclass);


--
-- Name: comment_likes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes ALTER COLUMN id SET DEFAULT nextval('public.comment_likes_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: follows id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows ALTER COLUMN id SET DEFAULT nextval('public.follows_id_seq'::regclass);


--
-- Name: group_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members ALTER COLUMN id SET DEFAULT nextval('public.group_members_id_seq'::regclass);


--
-- Name: group_post_comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_post_comments ALTER COLUMN id SET DEFAULT nextval('public.group_post_comments_id_seq'::regclass);


--
-- Name: group_posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_posts ALTER COLUMN id SET DEFAULT nextval('public.group_posts_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- Name: likes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes ALTER COLUMN id SET DEFAULT nextval('public.likes_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans ALTER COLUMN id SET DEFAULT nextval('public.plans_id_seq'::regclass);


--
-- Name: post_likes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes ALTER COLUMN id SET DEFAULT nextval('public.post_likes_id_seq'::regclass);


--
-- Name: post_media id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_media ALTER COLUMN id SET DEFAULT nextval('public.post_media_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: review_helpful id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_helpful ALTER COLUMN id SET DEFAULT nextval('public.review_helpful_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: search_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_logs ALTER COLUMN id SET DEFAULT nextval('public.search_logs_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: stories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories ALTER COLUMN id SET DEFAULT nextval('public.stories_id_seq'::regclass);


--
-- Name: story_likes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_likes ALTER COLUMN id SET DEFAULT nextval('public.story_likes_id_seq'::regclass);


--
-- Name: tag_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag_categories ALTER COLUMN id SET DEFAULT nextval('public.tag_categories_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: trip_days id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_days ALTER COLUMN id SET DEFAULT nextval('public.trip_days_id_seq'::regclass);


--
-- Name: trip_participants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_participants ALTER COLUMN id SET DEFAULT nextval('public.trip_participants_id_seq'::regclass);


--
-- Name: trips id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips ALTER COLUMN id SET DEFAULT nextval('public.trips_id_seq'::regclass);


--
-- Name: user_hidden_comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_hidden_comments ALTER COLUMN id SET DEFAULT nextval('public.user_hidden_comments_id_seq'::regclass);


--
-- Name: user_interests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_interests ALTER COLUMN id SET DEFAULT nextval('public.user_interests_id_seq'::regclass);


--
-- Name: user_role_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_logs ALTER COLUMN id SET DEFAULT nextval('public.user_role_logs_id_seq'::regclass);


--
-- Name: user_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tokens ALTER COLUMN id SET DEFAULT nextval('public.user_tokens_id_seq'::regclass);


--
-- Name: user_visited id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_visited ALTER COLUMN id SET DEFAULT nextval('public.user_visited_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);


--
-- Name: answer_helpful answer_helpful_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answer_helpful
    ADD CONSTRAINT answer_helpful_pkey PRIMARY KEY (id);


--
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (id);


--
-- Name: blogs blogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_pkey PRIMARY KEY (id);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: chats chats_user_one_id_user_two_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_user_one_id_user_two_id_key UNIQUE (user_one_id, user_two_id);


--
-- Name: checkins checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT checkins_pkey PRIMARY KEY (id);


--
-- Name: comment_likes comment_likes_comment_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_user_id_key UNIQUE (comment_id, user_id);


--
-- Name: comment_likes comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);


--
-- Name: group_post_comments group_post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_post_comments
    ADD CONSTRAINT group_post_comments_pkey PRIMARY KEY (id);


--
-- Name: group_posts group_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_posts
    ADD CONSTRAINT group_posts_pkey PRIMARY KEY (id);


--
-- Name: group_members group_user_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_user_unique UNIQUE (group_id, user_id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: groups groups_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_slug_key UNIQUE (slug);


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- Name: location_tags location_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_tags
    ADD CONSTRAINT location_tags_pkey PRIMARY KEY (location_id, tag_id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: locations locations_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_slug_key UNIQUE (slug);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_slug_key UNIQUE (slug);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_post_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_user_id_key UNIQUE (post_id, user_id);


--
-- Name: post_media post_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_media
    ADD CONSTRAINT post_media_pkey PRIMARY KEY (id);


--
-- Name: post_tags post_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_tags
    ADD CONSTRAINT post_tags_pkey PRIMARY KEY (post_id, tag_id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: posts posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_key UNIQUE (slug);


--
-- Name: question_followers question_followers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_followers
    ADD CONSTRAINT question_followers_pkey PRIMARY KEY (question_id, user_id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: review_helpful review_helpful_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_helpful
    ADD CONSTRAINT review_helpful_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roles roles_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_slug_key UNIQUE (slug);


--
-- Name: search_logs search_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_logs
    ADD CONSTRAINT search_logs_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: settings settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_setting_key_key UNIQUE (setting_key);


--
-- Name: stories stories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_pkey PRIMARY KEY (id);


--
-- Name: story_likes story_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_likes
    ADD CONSTRAINT story_likes_pkey PRIMARY KEY (id);


--
-- Name: tag_categories tag_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag_categories
    ADD CONSTRAINT tag_categories_pkey PRIMARY KEY (id);


--
-- Name: tag_categories tag_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag_categories
    ADD CONSTRAINT tag_categories_slug_key UNIQUE (slug);


--
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: tags tags_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_slug_key UNIQUE (slug);


--
-- Name: trip_days trip_days_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_days
    ADD CONSTRAINT trip_days_pkey PRIMARY KEY (id);


--
-- Name: trip_days trip_days_trip_id_day_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_days
    ADD CONSTRAINT trip_days_trip_id_day_number_key UNIQUE (trip_id, day_number);


--
-- Name: trip_participants trip_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_participants
    ADD CONSTRAINT trip_participants_pkey PRIMARY KEY (id);


--
-- Name: trip_participants trip_participants_trip_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_participants
    ADD CONSTRAINT trip_participants_trip_id_user_id_key UNIQUE (trip_id, user_id);


--
-- Name: trip_tags trip_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_tags
    ADD CONSTRAINT trip_tags_pkey PRIMARY KEY (trip_id, tag_id);


--
-- Name: trips trips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_pkey PRIMARY KEY (id);


--
-- Name: answer_helpful unique_answer_helpful; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answer_helpful
    ADD CONSTRAINT unique_answer_helpful UNIQUE (answer_id, user_id);


--
-- Name: follows unique_follow; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT unique_follow UNIQUE (follower_id, following_id);


--
-- Name: review_helpful unique_helpful; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_helpful
    ADD CONSTRAINT unique_helpful UNIQUE (review_id, user_id);


--
-- Name: user_interests unique_interest; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_interests
    ADD CONSTRAINT unique_interest UNIQUE (user_id, tag_id);


--
-- Name: likes unique_like; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT unique_like UNIQUE (user_id, post_id, comment_id, group_post_id);


--
-- Name: reviews unique_review; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT unique_review UNIQUE (user_id, location_id);


--
-- Name: checkins unique_user_destination; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT unique_user_destination UNIQUE (user_id, destination_id);


--
-- Name: user_visited unique_visited; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_visited
    ADD CONSTRAINT unique_visited UNIQUE (user_id, location_id);


--
-- Name: story_likes uq_story_likes; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_likes
    ADD CONSTRAINT uq_story_likes UNIQUE (story_id, user_id);


--
-- Name: user_hidden_comments user_hidden_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_hidden_comments
    ADD CONSTRAINT user_hidden_comments_pkey PRIMARY KEY (id);


--
-- Name: user_hidden_comments user_hidden_comments_user_id_comment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_hidden_comments
    ADD CONSTRAINT user_hidden_comments_user_id_comment_id_key UNIQUE (user_id, comment_id);


--
-- Name: user_interests user_interests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_interests
    ADD CONSTRAINT user_interests_pkey PRIMARY KEY (id);


--
-- Name: user_role_logs user_role_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_logs
    ADD CONSTRAINT user_role_logs_pkey PRIMARY KEY (id);


--
-- Name: user_tokens user_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tokens
    ADD CONSTRAINT user_tokens_pkey PRIMARY KEY (id);


--
-- Name: user_tokens user_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tokens
    ADD CONSTRAINT user_tokens_token_key UNIQUE (token);


--
-- Name: user_visited user_visited_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_visited
    ADD CONSTRAINT user_visited_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_answers_question; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_answers_question ON public.answers USING btree (question_id);


--
-- Name: idx_answers_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_answers_user ON public.answers USING btree (user_id);


--
-- Name: idx_checkins_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_checkins_location ON public.checkins USING btree (destination_id);


--
-- Name: idx_checkins_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_checkins_user ON public.checkins USING btree (user_id);


--
-- Name: idx_comments_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_parent ON public.comments USING btree (parent_id);


--
-- Name: idx_comments_post; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_post ON public.comments USING btree (post_id);


--
-- Name: idx_comments_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_user ON public.comments USING btree (user_id);


--
-- Name: idx_follows_follower; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_follows_follower ON public.follows USING btree (follower_id);


--
-- Name: idx_follows_following; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_follows_following ON public.follows USING btree (following_id);


--
-- Name: idx_group_members_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_group_members_group ON public.group_members USING btree (group_id);


--
-- Name: idx_group_members_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_group_members_status ON public.group_members USING btree (status);


--
-- Name: idx_group_members_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_group_members_user ON public.group_members USING btree (user_id);


--
-- Name: idx_group_post_comments_post; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_group_post_comments_post ON public.group_post_comments USING btree (group_post_id);


--
-- Name: idx_group_posts_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_group_posts_created ON public.group_posts USING btree (created_at DESC);


--
-- Name: idx_group_posts_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_group_posts_group ON public.group_posts USING btree (group_id);


--
-- Name: idx_group_posts_pinned; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_group_posts_pinned ON public.group_posts USING btree (is_pinned) WHERE (is_pinned = true);


--
-- Name: idx_group_posts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_group_posts_status ON public.group_posts USING btree (status);


--
-- Name: idx_groups_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_groups_active ON public.groups USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_groups_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_groups_dates ON public.groups USING btree (start_date, end_date);


--
-- Name: idx_groups_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_groups_location ON public.groups USING btree (location);


--
-- Name: idx_groups_owner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_groups_owner ON public.groups USING btree (owner_id);


--
-- Name: idx_groups_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_groups_slug ON public.groups USING btree (slug);


--
-- Name: idx_likes_comment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_likes_comment ON public.likes USING btree (comment_id);


--
-- Name: idx_likes_post; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_likes_post ON public.likes USING btree (post_id);


--
-- Name: idx_likes_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_likes_user ON public.likes USING btree (user_id);


--
-- Name: idx_locations_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_locations_featured ON public.locations USING btree (is_featured);


--
-- Name: idx_locations_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_locations_parent ON public.locations USING btree (parent_id);


--
-- Name: idx_locations_region; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_locations_region ON public.locations USING btree (region);


--
-- Name: idx_locations_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_locations_slug ON public.locations USING btree (slug);


--
-- Name: idx_locations_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_locations_type ON public.locations USING btree (type);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_password_resets_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_resets_email ON public.password_resets USING btree (email);


--
-- Name: idx_permissions_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_permissions_module ON public.permissions USING btree (module);


--
-- Name: idx_permissions_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_permissions_slug ON public.permissions USING btree (slug);


--
-- Name: idx_post_media_post; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_media_post ON public.post_media USING btree (post_id);


--
-- Name: idx_post_tags_post; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_tags_post ON public.post_tags USING btree (post_id);


--
-- Name: idx_post_tags_tag; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_tags_tag ON public.post_tags USING btree (tag_id);


--
-- Name: idx_posts_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_created ON public.posts USING btree (created_at);


--
-- Name: idx_posts_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_featured ON public.posts USING btree (is_featured);


--
-- Name: idx_posts_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_location ON public.posts USING btree (location_id);


--
-- Name: idx_posts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_status ON public.posts USING btree (status);


--
-- Name: idx_posts_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_type ON public.posts USING btree (post_type);


--
-- Name: idx_posts_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_user ON public.posts USING btree (user_id);


--
-- Name: idx_questions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_status ON public.questions USING btree (status);


--
-- Name: idx_questions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_user ON public.questions USING btree (user_id);


--
-- Name: idx_reports_reportable; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_reportable ON public.reports USING btree (reportable_type, reportable_id);


--
-- Name: idx_reviews_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_location ON public.reviews USING btree (location_id);


--
-- Name: idx_reviews_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_rating ON public.reviews USING btree (rating);


--
-- Name: idx_reviews_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_user ON public.reviews USING btree (user_id);


--
-- Name: idx_role_permissions_permission; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_permission ON public.role_permissions USING btree (permission_id);


--
-- Name: idx_role_permissions_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role_id);


--
-- Name: idx_roles_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_level ON public.roles USING btree (level);


--
-- Name: idx_roles_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_slug ON public.roles USING btree (slug);


--
-- Name: idx_search_logs_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_search_logs_created ON public.search_logs USING btree (created_at);


--
-- Name: idx_search_logs_keyword; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_search_logs_keyword ON public.search_logs USING btree (keyword);


--
-- Name: idx_stories_active_feed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stories_active_feed ON public.stories USING btree (user_id, expires_at) WHERE (is_active = true);


--
-- Name: idx_tags_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tags_slug ON public.tags USING btree (slug);


--
-- Name: idx_tags_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tags_type ON public.tags USING btree (type);


--
-- Name: idx_trip_tags_tag; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trip_tags_tag ON public.trip_tags USING btree (tag_id);


--
-- Name: idx_trip_tags_trip; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trip_tags_trip ON public.trip_tags USING btree (trip_id);


--
-- Name: idx_user_interests_tag; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_interests_tag ON public.user_interests USING btree (tag_id);


--
-- Name: idx_user_interests_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_interests_user ON public.user_interests USING btree (user_id);


--
-- Name: idx_user_role_logs_changed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_role_logs_changed_by ON public.user_role_logs USING btree (changed_by);


--
-- Name: idx_user_role_logs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_role_logs_user ON public.user_role_logs USING btree (user_id);


--
-- Name: idx_user_tokens_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_tokens_expires ON public.user_tokens USING btree (expires_at);


--
-- Name: idx_user_tokens_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_tokens_token ON public.user_tokens USING btree (token);


--
-- Name: idx_user_visited_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_visited_location ON public.user_visited USING btree (location_id);


--
-- Name: idx_user_visited_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_visited_user ON public.user_visited USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role_id);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: answers trg_answers_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_answers_updated BEFORE UPDATE ON public.answers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: groups trg_groups_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_groups_updated BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: locations trg_locations_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_locations_updated BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: posts trg_posts_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: questions trg_questions_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_questions_updated BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reviews trg_reviews_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: roles trg_roles_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_roles_updated BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: settings trg_settings_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users trg_users_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: answer_helpful answer_helpful_answer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answer_helpful
    ADD CONSTRAINT answer_helpful_answer_id_fkey FOREIGN KEY (answer_id) REFERENCES public.answers(id) ON DELETE CASCADE;


--
-- Name: answer_helpful answer_helpful_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answer_helpful
    ADD CONSTRAINT answer_helpful_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: answers answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: answers answers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: blogs blogs_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chats chats_user_one_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_user_one_id_fkey FOREIGN KEY (user_one_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chats chats_user_two_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_user_two_id_fkey FOREIGN KEY (user_two_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: checkins checkins_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT checkins_location_id_fkey FOREIGN KEY (destination_id) REFERENCES public.locations(id) ON DELETE CASCADE;


--
-- Name: checkins checkins_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT checkins_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE SET NULL;


--
-- Name: checkins checkins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT checkins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comments comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: questions fk_best_answer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT fk_best_answer FOREIGN KEY (best_answer_id) REFERENCES public.answers(id) ON DELETE SET NULL;


--
-- Name: chats fk_last_message; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT fk_last_message FOREIGN KEY (last_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: story_likes fk_story_likes_story; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_likes
    ADD CONSTRAINT fk_story_likes_story FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;


--
-- Name: story_likes fk_story_likes_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_likes
    ADD CONSTRAINT fk_story_likes_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_members group_members_invited_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_invited_by_id_fkey FOREIGN KEY (invited_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: group_members group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_post_comments group_post_comments_group_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_post_comments
    ADD CONSTRAINT group_post_comments_group_post_id_fkey FOREIGN KEY (group_post_id) REFERENCES public.group_posts(id) ON DELETE CASCADE;


--
-- Name: group_post_comments group_post_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_post_comments
    ADD CONSTRAINT group_post_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.group_post_comments(id) ON DELETE CASCADE;


--
-- Name: group_post_comments group_post_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_post_comments
    ADD CONSTRAINT group_post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_posts group_posts_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_posts
    ADD CONSTRAINT group_posts_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_posts group_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_posts
    ADD CONSTRAINT group_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: groups groups_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: likes likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: likes likes_group_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_group_post_id_fkey FOREIGN KEY (group_post_id) REFERENCES public.group_posts(id) ON DELETE CASCADE;


--
-- Name: likes likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: likes likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: location_tags location_tags_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_tags
    ADD CONSTRAINT location_tags_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;


--
-- Name: location_tags location_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_tags
    ADD CONSTRAINT location_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: locations locations_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.locations(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chats(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: plans plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: post_media post_media_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_media
    ADD CONSTRAINT post_media_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_tags post_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_tags
    ADD CONSTRAINT post_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: posts posts_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: posts posts_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: posts posts_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: question_followers question_followers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_followers
    ADD CONSTRAINT question_followers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: question_followers question_followers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_followers
    ADD CONSTRAINT question_followers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: questions questions_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: questions questions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: review_helpful review_helpful_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_helpful
    ADD CONSTRAINT review_helpful_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: review_helpful review_helpful_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_helpful
    ADD CONSTRAINT review_helpful_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: search_logs search_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_logs
    ADD CONSTRAINT search_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: stories stories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tags tags_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.tag_categories(id) ON DELETE SET NULL;


--
-- Name: trip_days trip_days_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_days
    ADD CONSTRAINT trip_days_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;


--
-- Name: trip_participants trip_participants_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_participants
    ADD CONSTRAINT trip_participants_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;


--
-- Name: trip_participants trip_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_participants
    ADD CONSTRAINT trip_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: trip_tags trip_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_tags
    ADD CONSTRAINT trip_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: trip_tags trip_tags_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_tags
    ADD CONSTRAINT trip_tags_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;


--
-- Name: trips trips_destination_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: trips trips_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_hidden_comments user_hidden_comments_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_hidden_comments
    ADD CONSTRAINT user_hidden_comments_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: user_hidden_comments user_hidden_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_hidden_comments
    ADD CONSTRAINT user_hidden_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_interests user_interests_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_interests
    ADD CONSTRAINT user_interests_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: user_interests user_interests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_interests
    ADD CONSTRAINT user_interests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_role_logs user_role_logs_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_logs
    ADD CONSTRAINT user_role_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_role_logs user_role_logs_new_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_logs
    ADD CONSTRAINT user_role_logs_new_role_id_fkey FOREIGN KEY (new_role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_role_logs user_role_logs_old_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_logs
    ADD CONSTRAINT user_role_logs_old_role_id_fkey FOREIGN KEY (old_role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- Name: user_role_logs user_role_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_logs
    ADD CONSTRAINT user_role_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_tokens user_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tokens
    ADD CONSTRAINT user_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_visited user_visited_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_visited
    ADD CONSTRAINT user_visited_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;


--
-- Name: user_visited user_visited_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_visited
    ADD CONSTRAINT user_visited_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 2rAdNBNg5rWD4fbR5LfUJgldstZN8lwQ2FwH9EpI3gbDpOK0Y96nakv9iB1YKDy

