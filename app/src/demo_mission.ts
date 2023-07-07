type VoteMachineType = 'SingleChoiceRaceToMax'

interface Data {
  options: string[]
  max: number
}

interface WormholeObject {
  integrator_address: string
  payload: string
}

interface Wormhole {
  [key: number]: WormholeObject[]
}

interface Checkpoint {
  id: string
  name: string
  data?: Data
  wormhole?: Wormhole
  children?: string[]
  vote_machine_type?: VoteMachineType
  is_output?: boolean
}

interface Mission {
  name: string
  description: string
  start: string
  checkpoints: Checkpoint[]
}

const mission: Mission = {
  name: 'Approve the grant #1001',
  description: 'Do a POC on Ethereum account signing a Solana transaction',
  start: 'start',
  checkpoints: [
    {
      id: 'start',
      name: 'As community member (anyone with SOL address), do you approve this?',
      data: {
        options: ['Yes', 'No'],
        max: 3,
      },
      children: ['start_council', 'start_no'],
      vote_machine_type: 'SingleChoiceRaceToMax',
    },
    {
      id: 'start_council',
      name: 'As council (council NFT holder), do you think this project will contribute to the ecosystem?',
      data: {
        options: ['Yes', 'No'],
        max: 3,
      },
      wormhole: {
        2: [
          { integrator_address: '0x123', payload: '0x456' },
          { integrator_address: '0x123', payload: '0x456' },
        ],
        1: [{ integrator_address: '0x123', payload: '0x456' }],
      },
      children: ['start_council_tech', 'start_council_no'],
      vote_machine_type: 'SingleChoiceRaceToMax',
    },
    {
      id: 'start_no',
      name: 'Sorry, community reject this grant',
      is_output: true,
    },
    {
      id: 'start_council_tech',
      name: 'As technical counselor (NFT technical counselor holder), do you think this project can deliver and how do you think about the cost?',
      data: {
        options: [
          'Yes, and cost is fair',
          "Yes, but let's make some chances. The cost is a bit high.",
          'No, it is not feasible to implement this Grant Application',
        ],
        max: 3,
      },
      wormhole: {
        4: [
          { integrator_address: '0x123', payload: '0x456' },
          { integrator_address: '0x123', payload: '0x456' },
        ],
      },
      children: [
        'start_council_tech_Yes_fair',
        'start_council',
        'start_council_tech_No',
      ],
      vote_machine_type: 'SingleChoiceRaceToMax',
    },
    {
      id: 'start_council_no',
      name: 'Sorry, the council dont see your project can contribute to the ecosystem',
      is_output: true,
    },
    {
      id: 'start_council_tech_Yes_fair',
      name: 'Awesome, your prosposal is granted!',
      is_output: true,
    },
    {
      id: 'start_council_tech_No',
      name: 'Hey, your proposal is not feasible.',
      is_output: true,
    },
  ],
}

interface MissionInfo {
  name: string
  description: string
}

export function getMissionInfo(mission: Mission): MissionInfo {
  return {
    name: mission.name,
    description: mission.description,
  }
}

const nameAndDescription: MissionInfo = getMissionInfo(mission)

// console.log(nameAndDescription);

interface CheckpointWithPositions {
  id: string
  name: string
  data?: Data
  wormhole?: Wormhole
  children?: number[]
  vote_machine_type?: VoteMachineType
  is_output?: boolean
}

function replaceChildrenWithPositions(
  checkpoints: Checkpoint[],
): CheckpointWithPositions[] {
  const idToIndexMap: { [key: string]: number } = {}

  checkpoints.forEach((checkpoint, index) => {
    idToIndexMap[checkpoint.id] = index
  })

  return checkpoints.map((checkpoint) => {
    const newCheckpoint: CheckpointWithPositions = {
      ...checkpoint,
      children:
        checkpoint.children?.map((childId) => idToIndexMap[childId]) || [],
    }

    return newCheckpoint
  })
}

interface MissionWithPositions {
  name: string
  description: string
  start: string
  checkpoints: CheckpointWithPositions[]
}

// Replace the children with positions
export const missionWithPositions: MissionWithPositions = {
  ...mission,
  checkpoints: replaceChildrenWithPositions(mission.checkpoints),
}
