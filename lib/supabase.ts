import { createClient } from '@supabase/supabase-js';

// استبدل هذه القيم بالقيم الخاصة بمشروعك من لوحة تحكم Supabase
// Settings -> API
const supabaseUrl = 'https://bzkwdedbkageanseadjo.supabase.co';
const supabaseKey = 'sb_publishable_AIgeihWUzA_b8uNFOAJROg__Hv2GDAi';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadImage = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from('images')
    .upload(filePath, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
