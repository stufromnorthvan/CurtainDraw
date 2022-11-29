import React, { useLayoutEffect, useState } from 'react';
import rough from 'roughjs/bundled/rough.esm';
import useApplicationData from "./hooks/useApplicationData";
import axios from 'axios';
import './App.css';
import getStroke from "perfect-freehand";

const generator = rough.generator();

const average = (a, b) => (a + b) / 2;


function getSvgPathFromStroke(points, closed = true) {
  const len = points.length;

  if (len < 4) {
    return ``;
  }

  let a = points[0];
  let b = points[1];
  const c = points[2];

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(
    2
  )} ${average(b[0], c[0]).toFixed(2)},${average(b[1], c[1]).toFixed(2)} T`;

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `;
  }

  if (closed) {
    result += 'Z';
  }

  return result;
}

const getRadiusDistance = (x1, y1, x2, y2) => {
  const base = x2 - x1;
  const height = y2 - y1;
  // A² + B² = C² for our case this is height² + base² = distance²
  // This means distance === square root of height² + base²
  const distance = Math.sqrt(Math.pow(base, 2) + Math.pow(height, 2));
  return distance;
};

function createElement(id, x1, y1, x2, y2, type, color, brushSize, fill) {
  switch (type) {
    case "line":
    case "rectangle":
      {
        const elementDetails = type === "line"
          ? generator.line(x1, y1, x2, y2, { stroke: color, strokeWidth: brushSize})
          : generator.rectangle(x1, y1, x2 - x1, y2 - y1, {
            fillStyle: 'solid',
            stroke: color,
            fill: fill,
          });
        return { id, x1, y1, x2, y2, type, elementDetails, color, brushSize };
      }
    case "circle":
      {
        const radius = getRadiusDistance(x1, y1, x2, y2);
        const diameter = radius * 2;
        const elementDetails = generator.circle(x1, y1, diameter, {
          fillStyle: 'solid',
          stroke: color,
          fill: fill,
        });
        return { id, x1, y1, x2, y2, type, elementDetails, color };
      }
    case "pencil":
      return { id, type, points: [{ x: x1, y: y1 }], color, brushSize };
    case "eraser":
      return { id, type, points: [{ x: x1, y: y1 }], brushSize };
    default: throw new Error(`Type not recognised: ${type}`);
  }
}

const drawElement = (roughCanvas, context, element, color) => {
  switch (element.type) {
    case "line":
      context.globalCompositeOperation="source-over";
    case "rectangle":
      context.globalCompositeOperation="source-over";
      roughCanvas.draw(element.elementDetails);
      break;
    case "circle":
      context.globalCompositeOperation="source-over";
      roughCanvas.draw(element.elementDetails);
      break;
    case "pencil":
      context.globalCompositeOperation="source-over";
      context.fillStyle = element.color;
      const outlinePoints = getStroke(element.points, { size: element.brushSize} );
      const pathData = getSvgPathFromStroke(outlinePoints);
      const myPath = new Path2D(pathData);
      context.fill(myPath);
      break;
    case "eraser":
      context.globalCompositeOperation="destination-out";
      context.lineWidth = 500;
      const eraserPoints = getStroke(element.points, { size: element.brushSize});
      const eraserData = getSvgPathFromStroke(eraserPoints);
      const eraserPath = new Path2D(eraserData);
      context.fill(eraserPath);
      break;
    default: throw new Error(`Type not recognised: ${element.type}`);
  }
};

const isWithinElement = (x, y, element) => {
  const { type, x1, x2, y1, y2 } = element;
  if (type === 'rectangle') {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  } else if (type === 'line') {
    const a = { x: x1, y: y1 };
    const b = { x: x2, y: y2 };
    const c = { x, y };
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));
    return Math.abs(offset) < 1;
  } else if (type === 'circle') {
    const circleRadius = getRadiusDistance(x1, y1, x2, y2);
    const cursorRadius = getRadiusDistance(x1, y1, x, y);
    return cursorRadius <= circleRadius;
  }
};

const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const getElementAtPosition = (x, y, elements) => {
  // reverse the elements array so that it gets last created element instead of first
  const reverseElements = [...elements].reverse();
  return reverseElements.find(element => isWithinElement(x, y, element));
};

export default function App() {
  // constructor(props) {
  //   super(props)
  //   this.state = {
  //     message: 'Click the button to load data!'
  //   }
  // }

  // fetchData = () => {
  //   axios.get('/api/data') // You can simply make your requests to "/api/whatever you want"
  //   .then((response) => {
  //     // handle success
  //     console.log(response.data) // The entire response from the Rails API

  //     console.log(response.data.message) // Just the message
  //     this.setState({
  //       message: response.data.message
  //     });
  //   }) 
  // }

  const [elements, setElements] = useState([]);
  const [action, setAction] = useState('none');
  const [tool, setTool] = useState("line");
  const [color, setColor] = React.useState("red");
  const [brushSize, setSize] = useState(25);
  const [selectedElement, setSelectedElement] = useState(null);

  const clear = () => {
    setElements([]);
  };

  const undo = () => {
    const elementsCopy = [...elements];
    elementsCopy.pop();
    setElements(elementsCopy);
  };

  useLayoutEffect(() => {
    const canvas = document.getElementById('curtaindraw');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    const roughCanvas = rough.canvas(canvas);

    // test shapes:
    // const rect = generator.rectangle(10, 10, 200, 200);
    // const circ = generator.circle(80, 80, 80, {fill: 'red', fillStyle: 'solid'});
    // const line = generator.line(10, 10, 200, 200);
    // roughCanvas.draw(circ);

    elements.forEach(element => drawElement(roughCanvas, context, element, color));
    // roughCanvas.draw(line);
  }, [elements]);

  const updateElement = (id, x1, y1, x2, y2, type, element, elementColor, elementBrushSize) => {
    const elementsCopy = [...elements];
    // console.log(element.color)
    const { fill } = element && element.elementDetails ? element.elementDetails.options : "";

    switch (type) {
      case "line":
        const lineElement = createElement(id, x1, y1, x2, y2, type, elementColor, elementBrushSize, fill);
        elementsCopy[id] = lineElement;
      case "rectangle":
        const moveElement = createElement(id, x1, y1, x2, y2, type, elementColor, elementBrushSize, fill);
        elementsCopy[id] = moveElement;
        break;
      case "circle":
        elementsCopy[id] = createElement(id, x1, y1, x2, y2, type, elementColor, elementBrushSize, fill);
        break;
      case "pencil":
        elementsCopy[id].points = [...elementsCopy[id].points, { x: x2, y: y2 }];
        break;
      case "eraser":
        elementsCopy[id].points = [...elementsCopy[id].points, { x: x2, y: y2 }];
        break;
      default:
        throw new Error(`Type not recognised: ${type}`);
    }

    setElements(elementsCopy);
  };

  const mouseDown = (event) => {
    const { clientX, clientY } = event;
    if (tool === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        console.log(element);
        const offsetX = clientX - element.x1;
        const offsetY = clientY - element.y1;
        setSelectedElement({ ...element, offsetX, offsetY });
        setAction("moving");
      }
    } else if (tool === "fill") {
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        let elementsCopy = [...elements];
        const index = element.id;
        const newColorElement = createElement(element.id, element.x1, element.y1, element.x2, element.y2, element.type, element.color, brushSize, color); // replace 'red' with colour state
        elementsCopy[index] = newColorElement;
        setElements(elementsCopy);
      }
    } else {
      const id = elements.length;
      const downElement = createElement(id, clientX, clientY, clientX, clientY, tool, color, brushSize);
      setElements(prevState => [...prevState, downElement]);
      setAction("drawing");
    }
  };

  const changeBrushSize = event => {
    setSize(event.target.value);
  };

  const mouseMove = (event) => {
    const { clientX, clientY } = event;

    if (tool === "selection") {
      event.target.style.cursor = getElementAtPosition(clientX, clientY, elements) ? "move" : "default";
    }

    if (tool === "fill") {
      event.target.style.cursor = getElementAtPosition(clientX, clientY, elements) ? "pointer" : "default";
    }


    if (action === "drawing") {
      const index = elements.length - 1;
      const { x1, y1 } = elements[index];
      updateElement(index, x1, y1, clientX, clientY, tool, selectedElement, color, brushSize);

    } else if (action === "moving") {
      const { id, x1, x2, y1, y2, type, offsetX, offsetY } = selectedElement;
      const width = x2 - x1;
      const height = y2 - y1;
      const offX1 = clientX - offsetX;
      const offY1 = clientY - offsetY;
      updateElement(id, offX1, offY1, offX1 + width, offY1 + height, type, selectedElement, selectedElement.color, selectedElement.brushSize);
    }
  };

  const mouseUp = (event) => {
    setAction("none");
    setSelectedElement(null);
  };

  return (
    <div>
      <div style={{ position: "fixed" }}>
        <input
          type="radio"
          id="selection"
          value="selection"
          checked={tool === "selection"}
          onChange={() => setTool("selection")} />
        <label htmlFor="line">Selection</label>
        <input
          type="radio"
          id="line"
          value="line"
          checked={tool === "line"}
          onChange={() => setTool("line")} />
        <label htmlFor="line">Line</label>
        <input
          type="radio"
          id="rectangle"
          value="rectangle"
          checked={tool === "rectangle"}
          onChange={() => setTool("rectangle")} />
        <label htmlFor="rectangle">Rectangle</label>
        <input
          type="radio"
          id="circle"
          value="circle"
          checked={tool === "circle"}
          onChange={() => setTool("circle")} />
        <label htmlFor="circle">Circle</label>
        <input
          type="radio"
          id="pencil"
          value="pencil"
          checked={tool === "pencil"}
          onChange={() => setTool("pencil")} />
        <label htmlFor="pencil">Pencil</label>
        <input
          type="radio"
          id="eraser"
          value="eraser"
          checked={tool === "eraser"}
          onChange={() => setTool("eraser")} />
        <label htmlFor="eraser">Eraser</label>
        <input
          type="radio"
          id="fill"
          value="fill"
          checked={tool === "fill"}
          onChange={() => setTool("fill")} />
        <label htmlFor="fill">Fill</label>
        <button onClick={undo}>Undo</button>
        <button onClick={clear}>Clear</button>
        <div style={{ display: "inline-block", marginLeft: "2rem" }}>
          <label>
            Black
            <input type="radio" checked={color === "black"} onChange={() => setColor("black")} />
          </label>
          <label>
            Red
            <input type="radio" checked={color === "red"} onChange={() => setColor("red")} />
          </label>
          <label>
            Green
            <input type="radio" checked={color === "green"} onChange={() => setColor("green")} />
          </label>
          <label>
            Blue
            <input type="radio" checked={color === "blue"} onChange={() => setColor("blue")} />
          </label>
        </div>
        <li class="option"> 
          Brush Size
          <input type="range" id= "size-slider" min="1" max="70" defaultValue="25" onChange={(event) => changeBrushSize(event) }></input>
          <h2>{brushSize}px</h2>
        </li>
        <button>Save</button>
      </div>
      <canvas
        id='curtaindraw'
        // style={{backgroundColor: 'blue'}}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={mouseDown}
        onMouseMove={mouseMove}
        onMouseUp={mouseUp}>
        Canvas
      </canvas>
    </div>
  );
}