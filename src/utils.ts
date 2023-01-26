
export function probToColor ( prob : number ) { 
  // returns hex color string
  // prob is a number between 0 and 100
  const hue = ( prob * 1.2 ) / 360 ;
  return  `hsl(${hue}, 100%, 50%)` ;
}