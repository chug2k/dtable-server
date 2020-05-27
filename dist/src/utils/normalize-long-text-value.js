"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var hrefReg = /\[.+\]\(\S+\)|<img src=(\S+).+\/>|!\[\]\(\S+\)|<\S+>/g;
var imageReg1 = /^<img src="(\S+)" .+\/>/;
var imageReg2 = /^!\[\]\((\S+)\)/;
var linkReg1 = /^\[.+\]\(\S+\)/;
var linkReg2 = /^<\S+>$/;

function getLinks(hrefs) {
  var hrefObj = {
    links: [],
    images: []
  };
  hrefs.forEach(function (href) {
    if (href.search(linkReg1) >= 0 || href.search(linkReg2) >= 0) {
      hrefObj.links.push(href);
    } else {
      var imageSrcs = href.match(imageReg1);
      var imageSrcs1 = href.match(imageReg2);

      if (imageSrcs) {
        hrefObj.images.push(imageSrcs[1]);
      } else if (imageSrcs1) {
        hrefObj.images.push(imageSrcs1[1]);
      }
    }
  });
  return hrefObj;
}

function getPreviewContent(markdownContent) {
  var preview = '';
  var newMarkdownContent = markdownContent.replace(hrefReg, '');
  var newMarkdownLength = newMarkdownContent.length;

  for (var index = 0; index < newMarkdownLength; index++) {
    if (newMarkdownContent[index] === '#') {
      continue;
    } else if (newMarkdownContent[index] === '\n') {
      preview += ' ';
    } else {
      preview += newMarkdownContent[index];
    }

    if (preview.length === 50) {
      break;
    }
  }

  preview = preview.length === newMarkdownLength ? preview : "".concat(preview, "...");
  var hrefs = markdownContent.match(hrefReg);

  if (hrefs) {
    var _getLinks = getLinks(hrefs),
        images = _getLinks.images,
        links = _getLinks.links;

    return {
      preview: preview,
      images: images,
      links: links
    };
  }

  return {
    preview: preview,
    images: [],
    links: []
  };
}

var _default = getPreviewContent;
exports["default"] = _default;