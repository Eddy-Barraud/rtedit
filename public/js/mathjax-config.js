MathJax.Hub.Config({
  skipStartupTypeset: true,
  messageStyle: "none", // Don't show message in lower left corner when processing.
  tex2jax: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]]
    // processEscapes: true
  },
  "HTML-CSS": {
    showMathMenu: false,
    scale: 85,
    availableFonts: ["TeX"] // Force pretty font, very important for me!
  },
  TeX: {
    // equationNumbers: { autoNumber: "AMS" },
    Macros: {
      vb: ["{\\bf #1}", 1]
    }
  }
});

MathJax.Hub.Configured();
