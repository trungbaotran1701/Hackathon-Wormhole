// Array of objects
const dataArray = [
  { field: 'trung', data: 'Hihi' },
  { field: 'chau', data: 'Hello' },
  { field: 'children', isRandomField: true },
  { field: 'hehe', data: 'blabla', isRandomField: true },
]

const createData = (data, isChildrenField, totalCheckpoints, currentId) => {
  if (isChildrenField) {
    let children = []
    // Generate a random number of children
    let numChildren = Math.floor(Math.random() * totalCheckpoints)
    while (children.length < numChildren) {
      // Randomly select a checkpoint as a child, excluding the current one
      let child
      do {
        child = Math.floor(Math.random() * totalCheckpoints)
      } while (child === currentId || children.includes(`checkpoint_${child}`))
      children.push(`checkpoint_${child}`)
    }
    return children.length > 0 ? children : undefined
  } else {
    return data
  }
}

const AddFieldAndData = (
  checkpoint,
  field,
  data,
  isRandomField = false,
  totalCheckpoints,
  currentId,
) => {
  // If isRandomField is true, there's a 50% chance we add the field
  if (!isRandomField || Math.random() > 0.5) {
    const newData = createData(
      data,
      field === 'children',
      totalCheckpoints,
      currentId,
    )
    if (newData !== undefined) {
      checkpoint[field] = newData
    }
  }
}

function createTree(
  dataArray,
  totalCheckpoints,
  remainingCheckpoints = totalCheckpoints,
  currentId = 0,
) {
  if (remainingCheckpoints === 0) {
    return []
  }

  const checkpoint = {
    id: `checkpoint_${currentId}`,
  }

  dataArray.forEach((obj) => {
    AddFieldAndData(
      checkpoint,
      obj.field,
      obj.data,
      obj.isRandomField,
      totalCheckpoints,
      currentId,
    )
  })

  return [checkpoint].concat(
    createTree(
      dataArray,
      totalCheckpoints,
      remainingCheckpoints - 1,
      currentId + 1,
    ),
  )
}

const result = createTree(dataArray, 4)
console.log(result)
