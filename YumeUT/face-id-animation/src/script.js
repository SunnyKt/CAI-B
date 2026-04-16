let timer;
const faceId = document.querySelector('.face-id-wrapper');
console.log(faceId);
faceId.addEventListener( 'mouseenter', function() {
  this.classList.add('active'); 
  timer = setTimeout(() => {
    this.classList.add('completed');
  }, 1700);
});

faceId.addEventListener( 'mouseleave', function() {
  clearTimeout(timer);
  this.classList.remove('active');
  this.classList.remove('completed');
});