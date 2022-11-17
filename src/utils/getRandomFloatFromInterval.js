const getRandomFloatFromInterval = (min, max, decimals) => {
    const str = (Math.random() * (max - min) + min).toFixed(decimals);
    return parseFloat(str);
}

export default getRandomFloatFromInterval
