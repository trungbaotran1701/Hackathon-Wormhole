// const mission = {
//   name: "Approve the grant #1001",
//   description: "Do a POC on Ethereum account signing a Solana transaction",
//   start: "start",
//   checkpoints: [
//     {
//       id: "start",
//       name: "As community member (anyone with SOL address), do you approve this?",
//       data: {
//         options: ["Yes", "No"],
//         max: 3,
//       },
//       children: ["start_council", "start_no"],
//       vote_machine_type: "SingleChoiceRaceToMax",
//     },
//     {
//       id: "start_council",
//       name: "As council (council NFT holder), do you think this project will contribute to the ecosystem?",
//       data: {
//         options: ["Yes", "No"],
//         max: 3,
//       },
//       wormhole: {
//         2: [
//           { integrator_address: "0x123", payload: "0x456" },
//           { integrator_address: "0x123", payload: "0x456" },
//         ],
//         1: [{ integrator_address: "0x123", payload: "0x456" }],
//       },
//       children: ["start_council_tech", "start_council_no"],
//       vote_machine_type: "SingleChoiceRaceToMax",
//     },
//     {
//       id: "start_no",
//       name: "Sorry, community reject this grant",
//       is_output: true,
//     },
//     {
//       id: "start_council_tech",
//       name: "As technical counselor (NFT technical counselor holder), do you think this project can deliver and how do you think about the cost?",
//       data: {
//         options: [
//           "Yes, and cost is fair",
//           "Yes, but let's make some chances. The cost is a bit high.",
//           "No, it is not feasible to implement this Grant Application",
//         ],
//         max: 3,
//       },
//       wormhole: {
//         4: [
//           { integrator_address: "0x123", payload: "0x456" },
//           { integrator_address: "0x123", payload: "0x456" },
//         ],
//       },
//       children: [
//         "start_council_tech_Yes_fair",
//         "start_council",
//         "start_council_tech_No",
//       ],
//       vote_machine_type: "SingleChoiceRaceToMax",
//     },
//     {
//       id: "start_council_no",
//       name: "Sorry, the council dont see your project can contribute to the ecosystem",
//       is_output: true,
//     },
//     {
//       id: "start_council_tech_Yes_fair",
//       name: "Awesome, your prosposal is granted!",
//       is_output: true,
//     },
//     {
//       id: "start_council_tech_No",
//       name: "Hey, your proposal is not feasible.",
//       is_output: true,
//     },
//   ],
// };

function createCheckpoints(numCheckpoints, maxChildren, currentId = 0) {
  if (numCheckpoints === 0) {
    return []
  }

  let checkpoint = {
    id: `checkpoint_${currentId}`,
    name: `Checkpoint ${currentId}`,
  }

  // Add the 'is_output' field randomly
  if (Math.random() > 0.7) {
    checkpoint.is_output = true
  } else {
    // Otherwise, add the optional fields
    checkpoint.data = {
      options: ['Yes', 'No'],
      max: 3,
    }
    checkpoint.vote_machine_type = 'SingleChoiceRaceToMax'

    let numChildren = Math.floor(Math.random() * maxChildren) + 1
    checkpoint.children = []
    for (let i = 0; i < numChildren; i++) {
      checkpoint.children.push(`checkpoint_${currentId + 1 + i}`)
    }
    // Optionally add the wormhole field
    if (Math.random() > 0.5) {
      checkpoint.wormhole = {
        2: [
          { integrator_address: '0x123', payload: '0x456' },
          { integrator_address: '0x123', payload: '0x456' },
        ],
        1: [{ integrator_address: '0x123', payload: '0x456' }],
      }
    }
  }

  return [checkpoint].concat(
    createCheckpoints(numCheckpoints - 1, maxChildren, currentId + 1),
  )
}

let mission = {
  name: 'Approve the grant #1001',
  description: 'Do a POC on Ethereum account signing a Solana transaction',
  start: 'start',
  checkpoints: createCheckpoints(50, 3), // Create 10 checkpoints, each with up to 3 children
}

console.log(JSON.stringify(mission, null, 2))
