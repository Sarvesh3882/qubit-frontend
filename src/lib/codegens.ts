/**
 * Code generators for every supported quantum framework.
 * Each generator takes (numQubits, gates) → string.
 *
 * Frameworks:
 *   qiskit     — Qiskit 2.x  (Python)
 *   pennylane  — PennyLane   (Python)
 *   cirq       — Cirq        (Python)
 *   qpiai      — QpiAI SDK   (Python)
 *   qbraid     — qBraid SDK  (Python, wraps Qiskit circuits)
 *   openqasm3  — OpenQASM 3.0 (text)
 */

import type { Gate, Framework } from "@/store/composerStore";

/* ─── Shared helpers ─────────────────────────────────────────────────────── */
const PI = Math.PI;
function fmtAngle(v: number): string {
  if (Math.abs(v - PI)       < 0.001) return "np.pi";
  if (Math.abs(v - PI / 2)   < 0.001) return "np.pi/2";
  if (Math.abs(v - PI / 4)   < 0.001) return "np.pi/4";
  if (Math.abs(v - 3*PI/4)   < 0.001) return "3*np.pi/4";
  if (Math.abs(v - 3*PI/2)   < 0.001) return "3*np.pi/2";
  if (Math.abs(v - 2*PI)     < 0.001) return "2*np.pi";
  return v.toFixed(4);
}

function sortedGates(gates: Gate[]): Gate[] {
  return [...gates].sort((a, b) => a.moment - b.moment);
}

/* ════════════════════════════════════════════════════════════════════════════
   QISKIT  (Qiskit 2.x)
   ════════════════════════════════════════════════════════════════════════════ */
export function generateQiskit(numQubits: number, gates: Gate[]): string {
  const L: string[] = [
    "from qiskit import QuantumRegister, ClassicalRegister, QuantumCircuit",
    "import numpy as np",
    "",
    `qreg_q = QuantumRegister(${numQubits}, 'q')`,
    `creg_c = ClassicalRegister(${numQubits}, 'c')`,
    `circuit = QuantumCircuit(qreg_q, creg_c)`,
    "",
  ];

  for (const g of sortedGates(gates)) {
    const q = g.qubits.map((i) => `qreg_q[${i}]`).join(", ");
    const p = g.params.length ? g.params.map(fmtAngle).join(", ") + ", " : "";
    switch (g.gate.toUpperCase()) {
      case "H":    L.push(`circuit.h(${q})`);         break;
      case "X":    L.push(`circuit.x(${q})`);         break;
      case "Y":    L.push(`circuit.y(${q})`);         break;
      case "Z":    L.push(`circuit.z(${q})`);         break;
      case "S":    L.push(`circuit.s(${q})`);         break;
      case "T":    L.push(`circuit.t(${q})`);         break;
      case "SDG":  L.push(`circuit.sdg(${q})`);       break;
      case "TDG":  L.push(`circuit.tdg(${q})`);       break;
      case "SX":   L.push(`circuit.sx(${q})`);        break;
      case "I":    L.push(`circuit.id(${q})`);        break;
      case "RX":   L.push(`circuit.rx(${p}${q})`);   break;
      case "RY":   L.push(`circuit.ry(${p}${q})`);   break;
      case "RZ":   L.push(`circuit.rz(${p}${q})`);   break;
      case "P":    L.push(`circuit.p(${p}${q})`);    break;
      case "CX":
      case "CNOT": L.push(`circuit.cx(${q})`);        break;
      case "CZ":   L.push(`circuit.cz(${q})`);        break;
      case "SWAP": L.push(`circuit.swap(${q})`);      break;
      case "CCX":  L.push(`circuit.ccx(${q})`);       break;
      case "M":
        L.push(`circuit.measure(qreg_q[${g.qubits[0]}], creg_c[${g.qubits[0]}])`);
        break;
      default:
        L.push(`# Unsupported: ${g.gate}`);
    }
  }

  L.push("");
  L.push("# --- Simulate with Aer (no transpile needed in Qiskit 2.x) ---");
  L.push("from qiskit_aer import AerSimulator");
  L.push("");
  L.push("simulator = AerSimulator(method='statevector')");
  L.push("circuit.save_statevector()");
  L.push("sv_job    = simulator.run(circuit, shots=1)");
  L.push("sv        = sv_job.result().get_statevector(circuit).data");
  L.push("probs     = {format(i, f'0{numQubits}b'): abs(a)**2 for i, a in enumerate(sv)}");
  L.push("print('Probabilities:', probs)");
  L.push("");
  L.push("# Shot-based counts");
  L.push("meas = circuit.copy()");
  L.push("meas.measure_all()");
  L.push("counts = simulator.run(meas, shots=1024).result().get_counts()");
  L.push("print('Counts:', counts)");

  return L.join("\n");
}

/* ════════════════════════════════════════════════════════════════════════════
   PENNYLANE
   ════════════════════════════════════════════════════════════════════════════ */
export function generatePennyLane(numQubits: number, gates: Gate[]): string {
  const L: string[] = [
    "import pennylane as qml",
    "import numpy as np",
    "",
    `dev = qml.device("default.qubit", wires=${numQubits})`,
    "",
    "@qml.qnode(dev)",
    "def circuit():",
  ];

  const hasMeasure = gates.some((g) => g.gate.toUpperCase() === "M");

  for (const g of sortedGates(gates)) {
    const wires = g.qubits.length === 1
      ? `wires=${g.qubits[0]}`
      : `wires=[${g.qubits.join(", ")}]`;
    const p = g.params.length ? g.params.map(fmtAngle).join(", ") + ", " : "";
    switch (g.gate.toUpperCase()) {
      case "H":    L.push(`    qml.Hadamard(${wires})`);        break;
      case "X":    L.push(`    qml.PauliX(${wires})`);          break;
      case "Y":    L.push(`    qml.PauliY(${wires})`);          break;
      case "Z":    L.push(`    qml.PauliZ(${wires})`);          break;
      case "S":    L.push(`    qml.S(${wires})`);               break;
      case "T":    L.push(`    qml.T(${wires})`);               break;
      case "SDG":  L.push(`    qml.adjoint(qml.S)(${wires})`);  break;
      case "TDG":  L.push(`    qml.adjoint(qml.T)(${wires})`);  break;
      case "SX":   L.push(`    qml.SX(${wires})`);              break;
      case "I":    L.push(`    qml.Identity(${wires})`);        break;
      case "RX":   L.push(`    qml.RX(${p}${wires})`);         break;
      case "RY":   L.push(`    qml.RY(${p}${wires})`);         break;
      case "RZ":   L.push(`    qml.RZ(${p}${wires})`);         break;
      case "P":    L.push(`    qml.PhaseShift(${p}${wires})`); break;
      case "CX":
      case "CNOT": L.push(`    qml.CNOT(${wires})`);            break;
      case "CZ":   L.push(`    qml.CZ(${wires})`);              break;
      case "SWAP": L.push(`    qml.SWAP(${wires})`);            break;
      case "CCX":  L.push(`    qml.Toffoli(${wires})`);         break;
      case "M":    break; // handled in return
      default:     L.push(`    # Unsupported: ${g.gate}`);
    }
  }

  if (hasMeasure) {
    L.push(`    return [qml.sample(qml.PauliZ(i)) for i in range(${numQubits})]`);
  } else {
    L.push(`    return qml.probs(wires=range(${numQubits}))`);
  }

  L.push("");
  L.push("# --- Statevector ---");
  L.push("probs = circuit()");
  L.push(`states = [format(i, '0${numQubits}b') for i in range(2**${numQubits})]`);
  L.push("print(dict(zip(states, probs)))");
  L.push("");
  L.push("# --- Shot-based counts ---");
  L.push(`dev_shots = qml.device("default.qubit", wires=${numQubits}, shots=1024)`);
  L.push("");
  L.push("@qml.qnode(dev_shots)");
  L.push("def circuit_shots():");
  // copy gate body lines (everything between def circuit(): and the return)
  const bodyLines = L.slice(7, L.length - 6).filter(l => l.startsWith("    "));
  for (const bl of bodyLines) L.push(bl);
  L.push(`    return qml.sample(wires=range(${numQubits}))`);
  L.push("");
  L.push("from collections import Counter");
  L.push("samples = circuit_shots()");
  L.push("counts  = Counter(''.join(str(b) for b in row) for row in samples)");
  L.push("print(dict(counts))");

  return L.join("\n");
}

/* ════════════════════════════════════════════════════════════════════════════
   CIRQ
   ════════════════════════════════════════════════════════════════════════════ */
export function generateCirq(numQubits: number, gates: Gate[]): string {
  const L: string[] = [
    "import cirq",
    "import numpy as np",
    "",
    `# Create ${numQubits} qubit(s)`,
    `qubits = [cirq.LineQubit(i) for i in range(${numQubits})]`,
    `circuit = cirq.Circuit()`,
    "",
    "# Build circuit",
  ];

  for (const g of sortedGates(gates)) {
    const q  = g.qubits.map((i) => `qubits[${i}]`).join(", ");
    const p  = g.params.length ? g.params.map(fmtAngle)[0] : null;
    switch (g.gate.toUpperCase()) {
      case "H":    L.push(`circuit.append(cirq.H(${q}))`);                        break;
      case "X":    L.push(`circuit.append(cirq.X(${q}))`);                        break;
      case "Y":    L.push(`circuit.append(cirq.Y(${q}))`);                        break;
      case "Z":    L.push(`circuit.append(cirq.Z(${q}))`);                        break;
      case "S":    L.push(`circuit.append(cirq.S(${q}))`);                        break;
      case "T":    L.push(`circuit.append(cirq.T(${q}))`);                        break;
      case "SDG":  L.push(`circuit.append(cirq.S(${q})**-1)`);                    break;
      case "TDG":  L.push(`circuit.append(cirq.T(${q})**-1)`);                    break;
      case "SX":   L.push(`circuit.append(cirq.X(${q})**0.5)`);                   break;
      case "I":    L.push(`circuit.append(cirq.I(${q}))`);                        break;
      case "RX":   L.push(`circuit.append(cirq.rx(rads=${p})(${q}))`);           break;
      case "RY":   L.push(`circuit.append(cirq.ry(rads=${p})(${q}))`);           break;
      case "RZ":   L.push(`circuit.append(cirq.rz(rads=${p})(${q}))`);           break;
      case "P":    L.push(`circuit.append(cirq.Z(${q})**(${p}/np.pi))`);         break;
      case "CX":
      case "CNOT": L.push(`circuit.append(cirq.CNOT(${q}))`);                     break;
      case "CZ":   L.push(`circuit.append(cirq.CZ(${q}))`);                       break;
      case "SWAP": L.push(`circuit.append(cirq.SWAP(${q}))`);                     break;
      case "CCX":  L.push(`circuit.append(cirq.CCX(${q}))`);                      break;
      case "M":    L.push(`circuit.append(cirq.measure(${q}, key='m${g.qubits[0]}'))`); break;
      default:     L.push(`# Unsupported: ${g.gate}`);
    }
  }

  L.push("");
  L.push("# --- Simulate ---");
  L.push("simulator = cirq.Simulator()");
  L.push("");
  L.push("# Statevector");
  L.push("sv_result = simulator.simulate(circuit)");
  L.push("sv        = sv_result.final_state_vector");
  L.push(`probs     = {format(i, '0${numQubits}b'): abs(a)**2 for i, a in enumerate(sv)}`);
  L.push("print('Probabilities:', probs)");
  L.push("");
  L.push("# Shot-based counts — add measure gates first");
  L.push(`circuit.append(cirq.measure(*qubits, key='result'))`);
  L.push("run_result = simulator.run(circuit, repetitions=1024)");
  L.push("print(run_result.histogram(key='result'))");

  return L.join("\n");
}

/* ════════════════════════════════════════════════════════════════════════════
   QpiAI SDK
   ════════════════════════════════════════════════════════════════════════════ */
export function generateQpiAI(numQubits: number, gates: Gate[]): string {
  const L: string[] = [
    "# QpiAI Quantum SDK",
    "# https://docs.qpiai.tech",
    "from qpiai import QuantumCircuit, execute",
    "import numpy as np",
    "",
    `qc = QuantumCircuit(${numQubits})`,
    "",
  ];

  for (const g of sortedGates(gates)) {
    // QpiAI uses 0-indexed qubit integers directly
    const q0 = g.qubits[0];
    const q1 = g.qubits[1];
    const p  = g.params.length ? g.params.map(fmtAngle)[0] : null;
    switch (g.gate.toUpperCase()) {
      case "H":    L.push(`qc.h(${q0})`);              break;
      case "X":    L.push(`qc.x(${q0})`);              break;
      case "Y":    L.push(`qc.y(${q0})`);              break;
      case "Z":    L.push(`qc.z(${q0})`);              break;
      case "S":    L.push(`qc.s(${q0})`);              break;
      case "T":    L.push(`qc.t(${q0})`);              break;
      case "SDG":  L.push(`qc.sdg(${q0})`);            break;
      case "TDG":  L.push(`qc.tdg(${q0})`);            break;
      case "SX":   L.push(`qc.sx(${q0})`);             break;
      case "I":    L.push(`qc.id(${q0})`);             break;
      case "RX":   L.push(`qc.rx(${p}, ${q0})`);      break;
      case "RY":   L.push(`qc.ry(${p}, ${q0})`);      break;
      case "RZ":   L.push(`qc.rz(${p}, ${q0})`);      break;
      case "P":    L.push(`qc.p(${p}, ${q0})`);       break;
      case "CX":
      case "CNOT": L.push(`qc.cx(${q0}, ${q1})`);     break;
      case "CZ":   L.push(`qc.cz(${q0}, ${q1})`);     break;
      case "SWAP": L.push(`qc.swap(${q0}, ${q1})`);   break;
      case "CCX":  L.push(`qc.ccx(${q0}, ${q1}, ${g.qubits[2]})`); break;
      case "M":    L.push(`qc.measure(${q0})`);        break;
      default:     L.push(`# Unsupported: ${g.gate}`);
    }
  }

  L.push("");
  L.push("# --- Execute on QpiAI cloud simulator ---");
  L.push("# result = execute(qc, backend='statevector_simulator', shots=1024)");
  L.push("# counts = result.get_counts()");
  L.push("# print(counts)");
  L.push("");
  L.push("# --- Local fallback via Qiskit Aer ---");
  L.push("from qiskit import QuantumCircuit as QC");
  L.push("from qiskit_aer import AerSimulator");
  L.push(`_qc = QC(${numQubits})`);
  // Emit the same gates but as Qiskit calls so the local fallback is runnable
  for (const g of sortedGates(gates)) {
    const q0 = g.qubits[0];
    const q1 = g.qubits[1];
    const p  = g.params.length ? g.params.map(fmtAngle)[0] : null;
    switch (g.gate.toUpperCase()) {
      case "H":    L.push(`_qc.h(${q0})`);              break;
      case "X":    L.push(`_qc.x(${q0})`);              break;
      case "Y":    L.push(`_qc.y(${q0})`);              break;
      case "Z":    L.push(`_qc.z(${q0})`);              break;
      case "S":    L.push(`_qc.s(${q0})`);              break;
      case "T":    L.push(`_qc.t(${q0})`);              break;
      case "SDG":  L.push(`_qc.sdg(${q0})`);            break;
      case "TDG":  L.push(`_qc.tdg(${q0})`);            break;
      case "SX":   L.push(`_qc.sx(${q0})`);             break;
      case "I":    L.push(`_qc.id(${q0})`);             break;
      case "RX":   L.push(`_qc.rx(${p}, ${q0})`);       break;
      case "RY":   L.push(`_qc.ry(${p}, ${q0})`);       break;
      case "RZ":   L.push(`_qc.rz(${p}, ${q0})`);       break;
      case "P":    L.push(`_qc.p(${p}, ${q0})`);        break;
      case "CX":
      case "CNOT": L.push(`_qc.cx(${q0}, ${q1})`);      break;
      case "CZ":   L.push(`_qc.cz(${q0}, ${q1})`);      break;
      case "SWAP": L.push(`_qc.swap(${q0}, ${q1})`);    break;
      case "CCX":  L.push(`_qc.ccx(${q0}, ${q1}, ${g.qubits[2]})`); break;
    }
  }
  L.push("_sim = AerSimulator(method='statevector')");
  L.push("_qc.save_statevector()");
  L.push("sv    = _sim.run(_qc, shots=1).result().get_statevector(_qc).data");
  L.push(`probs = {format(i,'0${numQubits}b'): abs(a)**2 for i,a in enumerate(sv)}`);
  L.push("print('Probabilities:', probs)");

  return L.join("\n");
}

/* ════════════════════════════════════════════════════════════════════════════
   qBraid SDK  (wraps provider-agnostic circuits)
   ════════════════════════════════════════════════════════════════════════════ */
export function generateQBraid(numQubits: number, gates: Gate[]): string {
  const L: string[] = [
    "# qBraid SDK — provider-agnostic quantum computing",
    "# https://docs.qbraid.com",
    "from qbraid.runtime import QbraidSession",
    "from qiskit import QuantumCircuit",
    "import numpy as np",
    "",
    "# Build circuit with Qiskit (qBraid accepts Qiskit, Cirq, PyTKET, etc.)",
    `qc = QuantumCircuit(${numQubits}, ${numQubits})`,
    "",
  ];

  for (const g of sortedGates(gates)) {
    const q = g.qubits.map((i) => `${i}`).join(", ");
    const p = g.params.length ? g.params.map(fmtAngle).join(", ") + ", " : "";
    switch (g.gate.toUpperCase()) {
      case "H":    L.push(`qc.h(${q})`);          break;
      case "X":    L.push(`qc.x(${q})`);          break;
      case "Y":    L.push(`qc.y(${q})`);          break;
      case "Z":    L.push(`qc.z(${q})`);          break;
      case "S":    L.push(`qc.s(${q})`);          break;
      case "T":    L.push(`qc.t(${q})`);          break;
      case "SDG":  L.push(`qc.sdg(${q})`);        break;
      case "TDG":  L.push(`qc.tdg(${q})`);        break;
      case "SX":   L.push(`qc.sx(${q})`);         break;
      case "I":    L.push(`qc.id(${q})`);         break;
      case "RX":   L.push(`qc.rx(${p}${q})`);    break;
      case "RY":   L.push(`qc.ry(${p}${q})`);    break;
      case "RZ":   L.push(`qc.rz(${p}${q})`);    break;
      case "P":    L.push(`qc.p(${p}${q})`);     break;
      case "CX":
      case "CNOT": L.push(`qc.cx(${q})`);         break;
      case "CZ":   L.push(`qc.cz(${q})`);         break;
      case "SWAP": L.push(`qc.swap(${q})`);        break;
      case "CCX":  L.push(`qc.ccx(${q})`);        break;
      case "M":
        L.push(`qc.measure(${g.qubits[0]}, ${g.qubits[0]})`);
        break;
      default:     L.push(`# Unsupported: ${g.gate}`);
    }
  }

  L.push("");
  L.push("# --- Submit via qBraid runtime (cloud) ---");
  L.push("# session  = QbraidSession()");
  L.push("# provider = session.get_device('aws_sv1')   # or 'ibm_*', 'ionq_*'");
  L.push("# job      = provider.run(qc, shots=1024)");
  L.push("# result   = job.result()");
  L.push("# print(result.measurement_counts())");
  L.push("");
  L.push("# --- Local fallback: Qiskit Aer ---");
  L.push("from qiskit_aer import AerSimulator");
  L.push("sim = AerSimulator(method='statevector')");
  L.push("qc.save_statevector()");
  L.push("sv    = sim.run(qc, shots=1).result().get_statevector(qc).data");
  L.push(`probs = {format(i, '0${numQubits}b'): abs(a)**2 for i, a in enumerate(sv)}`);
  L.push("print('Probabilities:', probs)");
  L.push("meas = qc.copy(); meas.measure_all()");
  L.push("counts = sim.run(meas, shots=1024).result().get_counts()");
  L.push("print('Counts:', counts)");

  return L.join("\n");
}

/* ════════════════════════════════════════════════════════════════════════════
   OpenQASM 3.0
   ════════════════════════════════════════════════════════════════════════════ */
export function generateOpenQASM3(numQubits: number, gates: Gate[]): string {
  const L: string[] = [
    "OPENQASM 3.0;",
    'include "stdgates.inc";',
    "",
    `qubit[${numQubits}] q;`,
    `bit[${numQubits}]   c;`,
    "",
  ];

  for (const g of sortedGates(gates)) {
    const q  = g.qubits.map((i) => `q[${i}]`).join(", ");
    const p  = g.params.length ? g.params.map((v) => v.toFixed(4)).join(", ") : "";
    switch (g.gate.toUpperCase()) {
      case "H":    L.push(`h ${q};`);                    break;
      case "X":    L.push(`x ${q};`);                    break;
      case "Y":    L.push(`y ${q};`);                    break;
      case "Z":    L.push(`z ${q};`);                    break;
      case "S":    L.push(`s ${q};`);                    break;
      case "T":    L.push(`t ${q};`);                    break;
      case "SDG":  L.push(`sdg ${q};`);                  break;
      case "TDG":  L.push(`tdg ${q};`);                  break;
      case "SX":   L.push(`sx ${q};`);                   break;
      case "I":    L.push(`id ${q};`);                   break;
      case "RX":   L.push(`rx(${p}) ${q};`);             break;
      case "RY":   L.push(`ry(${p}) ${q};`);             break;
      case "RZ":   L.push(`rz(${p}) ${q};`);             break;
      case "P":    L.push(`p(${p}) ${q};`);              break;
      case "CX":
      case "CNOT": L.push(`cx ${q};`);                   break;
      case "CZ":   L.push(`cz ${q};`);                   break;
      case "SWAP": L.push(`swap ${q};`);                  break;
      case "CCX":  L.push(`ccx ${q};`);                  break;
      case "M":    L.push(`c[${g.qubits[0]}] = measure q[${g.qubits[0]}];`); break;
      default:     L.push(`// Unsupported: ${g.gate}`);
    }
  }

  L.push("");
  L.push("// --- Run via Qiskit QASM3 loader ---");
  L.push("// from qiskit.qasm3 import loads");
  L.push("// from qiskit_aer import AerSimulator");
  L.push("// import numpy as np");
  L.push("//");
  L.push("// qc  = loads(qasm_string)");
  L.push("// sim = AerSimulator(method='statevector')");
  L.push("// qc.save_statevector()");
  L.push("// sv    = sim.run(qc, shots=1).result().get_statevector(qc).data");
  L.push(`// probs = {format(i,'0${numQubits}b'): abs(a)**2 for i,a in enumerate(sv)}`);
  L.push("// print(probs)");

  return L.join("\n");
}

/* ════════════════════════════════════════════════════════════════════════════
   DISPATCHER
   ════════════════════════════════════════════════════════════════════════════ */
export function generateCode(
  framework: Framework,
  numQubits: number,
  gates: Gate[]
): string {
  switch (framework) {
    case "qiskit":    return generateQiskit(numQubits, gates);
    case "pennylane": return generatePennyLane(numQubits, gates);
    case "cirq":      return generateCirq(numQubits, gates);
    case "qpiai":     return generateQpiAI(numQubits, gates);
    case "qbraid":    return generateQBraid(numQubits, gates);
    case "openqasm3": return generateOpenQASM3(numQubits, gates);
    default:          return generateQiskit(numQubits, gates);
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   PARSER  — code → gates (Qiskit Python + OpenQASM 3 only for now)
   Parses a limited subset of gate calls back to our Gate representation.
   ════════════════════════════════════════════════════════════════════════════ */

const QISKIT_GATE_RE =
  /circuit\.(h|x|y|z|s|t|sdg|tdg|sx|id|rx|ry|rz|p|cx|cz|swap|ccx|measure)\s*\(([^)]*)\)/gi;

const PENNYLANE_GATE_RE =
  /qml\.(Hadamard|PauliX|PauliY|PauliZ|S|T|SX|Identity|RX|RY|RZ|PhaseShift|CNOT|CZ|SWAP|Toffoli)\s*\(([^)]*)\)/gi;

const QASM3_GATE_RE =
  /^(h|x|y|z|s|t|sdg|tdg|sx|id|rx|ry|rz|p|cx|cz|swap|ccx)\s*(?:\(([^)]*)\)\s*)?([^;]+);/gim;

const QASM3_MEASURE_RE =
  /c\[(\d+)\]\s*=\s*measure\s+q\[(\d+)\]/gi;

function parseQubitIndex(s: string): number {
  // Matches qreg_q[N], q[N], or plain N
  const m = s.match(/\[(\d+)\]/) ?? s.match(/(\d+)$/);
  return m ? parseInt(m[1]) : 0;
}

function parseAngle(s: string): number {
  const t = s.trim()
    .replace(/np\.pi/g, String(Math.PI))
    .replace(/math\.pi/g, String(Math.PI))
    .replace(/pi/gi,  String(Math.PI));
  try { return Function(`"use strict"; return (${t})`)() as number; }
  catch { return parseFloat(t) || 0; }
}

function maxQubitIn(gs: Omit<Gate, "id">[]): number {
  return gs.reduce((m, g) => Math.max(m, ...g.qubits), 0);
}

export function parseQiskitCode(code: string): { gates: Omit<Gate, "id">[]; numQubits: number } | null {
  try {
    const gates: Omit<Gate, "id">[] = [];
    let moment = 0;
    let match: RegExpExecArray | null;
    const re = new RegExp(QISKIT_GATE_RE.source, "gi");

    while ((match = re.exec(code)) !== null) {
      const name   = match[1].toUpperCase();
      const argStr = match[2];
      const args   = argStr.split(",").map((s) => s.trim()).filter(Boolean);

      if (name === "MEASURE") {
        const qIdx = parseQubitIndex(args[0]);
        gates.push({ gate: "M", qubits: [qIdx], params: [], moment: moment++ });
        continue;
      }

      // Detect if first arg is a param (number / np.pi expr) or a qubit
      const isQiskitParam = (s: string) =>
        /^[\d\.\-\+\*\/()]+/.test(s.trim()) || /np\.pi|math\.pi|\bpi\b/i.test(s);

      const PARAM_GATES = ["RX", "RY", "RZ", "P"];
      const MULTI_GATES = ["CX", "CZ", "SWAP", "CCX", "CNOT"];

      if (PARAM_GATES.includes(name)) {
        // First arg is always the angle, rest are qubits
        const angle  = parseAngle(args[0]);
        const qubits = args.slice(1).map(parseQubitIndex);
        gates.push({ gate: name, qubits, params: [angle], moment: moment++ });
      } else if (MULTI_GATES.includes(name)) {
        const qubits = args.map(parseQubitIndex);
        gates.push({ gate: name, qubits, params: [], moment: moment++ });
      } else {
        const qubit = parseQubitIndex(args[0]);
        gates.push({ gate: name === "ID" ? "I" : name, qubits: [qubit], params: [], moment: moment++ });
      }
    }

    if (gates.length === 0) return null;

    // Detect numQubits from QuantumRegister call or max qubit index
    const qregMatch = code.match(/QuantumRegister\((\d+)/);
    const numQubits = qregMatch
      ? parseInt(qregMatch[1])
      : maxQubitIn(gates) + 1;

    return { gates, numQubits };
  } catch {
    return null;
  }
}

export function parseOpenQASM3(code: string): { gates: Omit<Gate, "id">[]; numQubits: number } | null {
  try {
    const gates: Omit<Gate, "id">[] = [];
    let moment = 0;

    // Parse qubit register size
    const qubitMatch = code.match(/qubit\[(\d+)\]/);
    const numQubits  = qubitMatch ? parseInt(qubitMatch[1]) : 1;

    // Parse gates
    const re = new RegExp(QASM3_GATE_RE.source, "gim");
    let match: RegExpExecArray | null;
    while ((match = re.exec(code)) !== null) {
      const name    = match[1].toUpperCase();
      const paramS  = match[2]?.trim() ?? "";
      const qubitS  = match[3]?.trim() ?? "";
      const qubits  = qubitS.split(",").map((s) => parseQubitIndex(s.trim()));
      const params  = paramS ? [parseAngle(paramS)] : [];

      const gname = name === "ID" ? "I" : name === "CNOT" ? "CX" : name;
      gates.push({ gate: gname, qubits, params, moment: moment++ });
    }

    // Parse measure
    const mRe = new RegExp(QASM3_MEASURE_RE.source, "gi");
    while ((match = mRe.exec(code)) !== null) {
      gates.push({ gate: "M", qubits: [parseInt(match[2])], params: [], moment: moment++ });
    }

    if (gates.length === 0) return null;
    return { gates, numQubits };
  } catch {
    return null;
  }
}

export function parseCode(
  framework: Framework,
  code: string
): { gates: Omit<Gate, "id">[]; numQubits: number } | null {
  switch (framework) {
    case "qiskit":
    case "qbraid":
    case "qpiai":
      return parseQiskitCode(code);
    case "openqasm3":
      return parseOpenQASM3(code);
    case "pennylane":
    case "cirq":
      // Basic fallback — try Qiskit-style parse (limited)
      return parseQiskitCode(code);
    default:
      return parseQiskitCode(code);
  }
}

/* ─── Framework metadata ────────────────────────────────────────────────── */
export const FRAMEWORKS: {
  id: Framework;
  label: string;
  lang: string;
  badge: string;
  color: string;
  description: string;
}[] = [
  {
    id: "qiskit",
    label: "Qiskit",
    lang: "python",
    badge: "IBM",
    color: "#6343d8",
    description: "Qiskit 2.x + Qiskit Aer — full simulation supported",
  },
  {
    id: "pennylane",
    label: "PennyLane",
    lang: "python",
    badge: "Xanadu",
    color: "#55ab4b",
    description: "PennyLane QNode — differentiable quantum programming",
  },
  {
    id: "cirq",
    label: "Cirq",
    lang: "python",
    badge: "Google",
    color: "#ea4335",
    description: "Google Cirq — NISQ-focused circuit model",
  },
  {
    id: "qpiai",
    label: "QpiAI",
    lang: "python",
    badge: "QpiAI",
    color: "#0ea5e9",
    description: "QpiAI Quantum SDK — Indian quantum platform",
  },
  {
    id: "qbraid",
    label: "qBraid",
    lang: "python",
    badge: "qBraid",
    color: "#f59e0b",
    description: "qBraid SDK — provider-agnostic, runs on IBM, AWS, IonQ",
  },
  {
    id: "openqasm3",
    label: "OpenQASM 3",
    lang: "qasm",
    badge: "QASM",
    color: "#8b5cf6",
    description: "OpenQASM 3.0 — quantum assembly language standard",
  },
];
