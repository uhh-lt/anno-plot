import * as d3 from "d3";

export function hexToReactColor(hex) {

    if (hex.startsWith('#')) {
        hex = hex.slice(1);
    }

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);


    return { r, g, b, a: 1 };
}

export function reactColorToHex(colorObj) {
    const { r, g, b } = colorObj;
    const toHex = (c) => ('0' + c.toString(16)).slice(-2);

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getPath(codes, code, seperator = "/"){
    let path = [];
    let currentCode = code;
    while (currentCode !== null && currentCode !== undefined) {
        path.push(currentCode.text);
        currentCode = codes.find(c => c.code_id === currentCode.parent_code_id);
    }
    path.reverse();
    return path.join(seperator);
}

// from tutorial https://github.com/ColinEberhardt/d3fc-webgl-hathi-explorer/blob/bdabb3a0a83f7514d0e86b472b572f8d4e4ccf52/util.js
export const webglColor = color => {
  const colorObj = d3.color(color);
  if (!colorObj) {
    return [0, 0, 0, 1];
  }

  const { r, g, b, opacity } = colorObj.rgb();
  return [r / 255, g / 255, b / 255, opacity];
};


export const hexToRGBA = (hex, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const hashCode = s =>
  s.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);