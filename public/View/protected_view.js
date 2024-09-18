export async function protectedView() {
    const response = await fetch('/view/templates/protected_page_template.html',
        { cache: 'no-store' });
    return await response.text();
}