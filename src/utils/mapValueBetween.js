const mapValueBetween = (value, valueMin, valueMax, targetMin, targetMax) => {
  return (
    ((value - valueMin) * (targetMax - targetMin)) / (valueMax - valueMin) +
    targetMin
  )
}

export default mapValueBetween
