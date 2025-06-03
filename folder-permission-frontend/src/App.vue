<script setup lang="ts">
// No setup code needed here
</script>

<template>
  <div class="app-container">
    <header class="main-header">
      <div class="container">
        <h1 class="app-title">Folder Management System</h1>
        <nav class="main-nav">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/files" class="nav-link">Files</router-link>
          <router-link to="/permissions" class="nav-link">Permissions</router-link>
        </nav>
      </div>
    </header>
    
    <main class="main-content">
      <router-view />
    </main>
    
    <footer class="main-footer">
      <div class="container">
        <p>&copy; 2025 Folder Management System</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-header {
  background-color: #3498db;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.main-header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.main-nav {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background-color: white;
  transition: width 0.3s;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

.main-content {
  flex: 1;
  padding: 0;
}

.main-footer {
  background-color: #f8f9fa;
  padding: 1.5rem 0;
  border-top: 1px solid #e9ecef;
  font-size: 0.875rem;
  color: #6c757d;
}

@media (max-width: 768px) {
  .main-header .container {
    flex-direction: column;
    padding: 1rem;
  }
  
  .main-nav {
    margin-top: 1rem;
  }
}
</style>
