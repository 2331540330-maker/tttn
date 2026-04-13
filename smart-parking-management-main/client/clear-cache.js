// Clear Service Worker and Cache
// Paste this into Browser Console (F12)

// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
        registration.unregister();
        console.log('✅ Unregistered:', registration);
    }
});

// Clear all caches
caches.keys().then(function (names) {
    for (let name of names)
        caches.delete(name);
    console.log('✅ Cleared all caches');
});

console.log('✅ Done! Now refresh the page (F5)');
