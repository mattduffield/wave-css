// Wave CSS Theme Init — place in <head> before stylesheets to prevent theme flash.
// Usage: <script src="/static/js/wave-css-0.0.1/wave-theme-init.js"></script>
(function(){
  try {
    var d = document.documentElement;

    // Hide page until CSS loads to prevent layout flash
    d.style.visibility = 'hidden';

    var t = localStorage.getItem('theme');
    var m = localStorage.getItem('darkMode');
    if (t) {
      var cls = d.classList;
      for (var i = cls.length - 1; i >= 0; i--) {
        if (cls[i].indexOf('theme-') === 0) cls.remove(cls[i]);
      }
      cls.add('theme-' + t);
    }
    if (m !== null) {
      if (m === 'true') {
        d.classList.remove('light');
        d.classList.add('dark');
      } else {
        d.classList.remove('dark');
        d.classList.add('light');
      }
    }

    // Reveal page once CSS has been parsed and applied
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        d.style.visibility = '';
      }, { once: true });
    } else {
      d.style.visibility = '';
    }
  } catch(e) {
    document.documentElement.style.visibility = '';
  }
})();
