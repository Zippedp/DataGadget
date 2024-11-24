// keydown events for 3js cam movments
window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      targetXOffset -= 4;
    } else if (event.key === 'ArrowRight') {
      targetXOffset += 4;
    }
  });
  
  // update renderer on window resize
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
  