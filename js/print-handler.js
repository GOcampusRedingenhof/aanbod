@media print {
  body {
    margin: 0;
    padding: 1cm;
    font-size: 10pt;
    color: #000;
    background: none;
  }

  .print-header {
    display: block;
    margin-bottom: 1rem;
  }

  .print-logo {
    height: 40px;
  }

  .print-footer {
    display: block;
    position: fixed;
    bottom: 1cm;
    left: 1cm;
    right: 1cm;
    text-align: right;
    font-size: 10pt;
    color: #333;
  }

  #print-button,
  nav,
  footer,
  .domains-grid,
  .slide-in,
  .screen-only {
    display: none !important;
  }

  #print-content, .print-container {
    display: block;
    width: 100%;
    max-height: 25cm;
    overflow: hidden;
    page-break-inside: avoid;
  }

  @page {
    size: A4 portrait;
    margin: 1cm;
  }
}

@media screen {
  .print-header,
  .print-footer {
    display: none;
  }
}
