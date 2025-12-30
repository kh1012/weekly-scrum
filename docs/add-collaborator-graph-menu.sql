-- Add collaborator-graph menu to all existing workspaces
-- This ensures the new menu appears by default for all workspaces

INSERT INTO public.menu_settings (workspace_id, menu_key, is_enabled, tag_label, tag_color)
SELECT 
  w.workspace_id, 
  'collaborator-graph', 
  true, 
  'NEW', 
  'blue'
FROM public.workspaces w
WHERE NOT EXISTS (
  SELECT 1
  FROM public.menu_settings ms
  WHERE ms.workspace_id = w.workspace_id
    AND ms.menu_key = 'collaborator-graph'
);

-- Verify the insertion
SELECT 
  workspace_id, 
  menu_key, 
  is_enabled, 
  tag_label, 
  tag_color,
  created_at
FROM public.menu_settings
WHERE menu_key = 'collaborator-graph'
ORDER BY created_at DESC;

