const eqSet = (set1, set2) => {
	let s = new Set([...set1, ...set2])
	return s.size == set1.size && s.size == set2.size
}
module.exports = eqSet
