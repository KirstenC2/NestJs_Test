<template>
  <div class="home">
    <h1>Folder Permission System</h1>
    <p>Welcome to the Folder Permission System. This application allows you to manage files and set specific permissions for users or groups.</p>
    
    <div class="feature-links">
      <router-link to="/files" class="feature-card">
        <h2>File Management</h2>
        <p>Upload, download, and delete files</p>
      </router-link>
      
      <router-link to="/permissions" class="feature-card">
        <h2>Permission Management</h2>
        <p>Set read/write permissions for users and groups</p>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// No additional logic needed for the home page
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.feature-links {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
}

.feature-card {
  flex: 1;
  padding: 1.5rem;
  border-radius: 8px;
  background-color: #f8f9fa;
  color: #2c3e50;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.feature-card h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #3498db;
}
</style>
