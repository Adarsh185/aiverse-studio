-- Create files table for storing user files
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  content TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'file', -- 'file' or 'folder'
  parent_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  language TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, path)
);

-- Enable RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own files" ON public.files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own files" ON public.files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own files" ON public.files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own files" ON public.files FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();