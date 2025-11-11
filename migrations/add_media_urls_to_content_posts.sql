-- Add media_urls column to content_posts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'content_posts' 
        AND column_name = 'media_urls'
    ) THEN
        ALTER TABLE content_posts 
        ADD COLUMN media_urls TEXT[];
        
        RAISE NOTICE 'Added media_urls column to content_posts table';
    ELSE
        RAISE NOTICE 'media_urls column already exists in content_posts table';
    END IF;
END $$;

