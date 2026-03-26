-- Add videos column to cases table for video file support
ALTER TABLE IF EXISTS public.cases 
ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.cases.videos IS 'Array of video URLs for the case (MP4, WebM, MOV, etc.)';
