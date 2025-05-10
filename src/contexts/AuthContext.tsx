
// Add error handling to setFavoriteColor function
// This is a simplified fix - we're only fixing the catch method error without changing other functionality

// Find the setFavoriteColor function and update it to properly handle Promise rejections
// The issue is with this function in AuthContext.tsx:

// Original problematic code:
// const setFavoriteColor = async (color: string): Promise<void> => {
//   const { error } = await supabase
//     .from('user_preferences')
//     .upsert({ user_id: user!.id, favorite_color: color }, { onConflict: 'user_id' })
//     .single()
//     .catch(error => {
//       console.error("Error saving color preference:", error);
//       return { error };
//     });
// };

// Fixed code should handle the promise properly:
const setFavoriteColor = async (color: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user!.id, favorite_color: color }, { onConflict: 'user_id' });
    
    if (error) throw error;
    
    // Update the local state after successful DB update
    setFavoriteColorState(color);
  } catch (error) {
    console.error("Error saving color preference:", error);
    throw error;
  }
};
