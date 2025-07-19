
// This file can be removed or kept as a placeholder for a future "Manage Stories" page.
// The primary creation logic is in the 'create' sub-directory.
import { redirect } from 'next/navigation';

export default function ManageStoriesPage() {
    // Redirect to the create page as it's the main function for now.
    redirect('/admin/dashboard/stories/create');
}
