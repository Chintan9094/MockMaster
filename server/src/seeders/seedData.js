const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const Test = require('../models/Test');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wireless-psi-prep';

const chaptersData = [
  {
    number: 1,
    title: 'Electronics Components, Devices and Circuits',
    topics: [
      {
        title: 'Semiconductors & Diodes',
        questions: [
          { q: 'Which material is best for high temp applications?', opts: ['Silicon', 'Germanium', 'Gallium Arsenide', 'Copper'], ans: 'C', exp: 'GaAs has a wider bandgap (1.43 eV) making it suitable for high-temperature applications.' },
          { q: 'The forward voltage drop of a silicon diode is approximately?', opts: ['0.3V', '0.7V', '1.1V', '0.5V'], ans: 'B', exp: 'Silicon diodes have a typical forward voltage drop of 0.6-0.7V.' },
          { q: 'Zener diode is primarily used as?', opts: ['Amplifier', 'Voltage regulator', 'Oscillator', 'Mixer'], ans: 'B', exp: 'Zener diode operates in reverse breakdown providing constant voltage for regulation.' },
          { q: 'Which diode is used for high-frequency rectification?', opts: ['Zener', 'Schottky', 'Tunnel', 'Varactor'], ans: 'B', exp: 'Schottky diodes have very fast switching due to no minority carrier storage.' },
          { q: 'The bandgap energy of Silicon at room temperature is?', opts: ['0.67 eV', '1.12 eV', '1.43 eV', '2.0 eV'], ans: 'B', exp: 'Silicon has a bandgap of 1.12 eV at 300K.' },
          { q: 'LED works on the principle of?', opts: ['Photoelectric effect', 'Electroluminescence', 'Thermionic emission', 'Piezoelectric effect'], ans: 'B', exp: 'LEDs emit light through electroluminescence when electrons recombine with holes.' },
          { q: 'PIV stands for?', opts: ['Peak Inverse Voltage', 'Power Input Value', 'Peak Input Voltage', 'Positive Inverse Voltage'], ans: 'A', exp: 'PIV is the maximum reverse voltage a diode can withstand without breakdown.' },
          { q: 'A varactor diode is used for?', opts: ['Voltage regulation', 'Frequency tuning', 'Power rectification', 'Light emission'], ans: 'B', exp: 'Varactor diodes have voltage-dependent capacitance for frequency tuning.' },
          { q: 'Tunnel diode exhibits?', opts: ['Positive resistance only', 'Negative resistance', 'Zero resistance', 'Infinite resistance'], ans: 'B', exp: 'Tunnel diodes show negative differential resistance due to quantum tunneling.' },
          { q: 'Photodiode operates in which bias?', opts: ['Forward', 'Reverse', 'No bias', 'Both'], ans: 'B', exp: 'Photodiodes operate in reverse bias for photocurrent generation.' },
        ]
      },
      {
        title: 'Transistors (BJT & FET)',
        questions: [
          { q: 'In a BJT, the base region is?', opts: ['Heavily doped', 'Lightly doped and thin', 'Undoped', 'Same as emitter'], ans: 'B', exp: 'Base is thin and lightly doped to allow carriers to reach collector.' },
          { q: 'MOSFET is a?', opts: ['Current controlled', 'Voltage controlled', 'Power controlled', 'Resistance controlled'], ans: 'B', exp: 'MOSFET drain current is controlled by gate-source voltage.' },
          { q: 'Current gain β in CE configuration is typically?', opts: ['< 1', '1-10', '20-500', '> 1000'], ans: 'C', exp: 'CE current gain β = Ic/Ib typically ranges from 20 to 500.' },
          { q: 'JFET is normally?', opts: ['ON device', 'OFF device', 'Neither', 'Depends'], ans: 'A', exp: 'JFET conducts with zero gate voltage (depletion mode device).' },
          { q: 'Which configuration gives highest voltage gain?', opts: ['Common Base', 'Common Emitter', 'Common Collector', 'All equal'], ans: 'B', exp: 'CE provides highest voltage gain among BJT configurations.' },
          { q: 'Darlington pair provides?', opts: ['High voltage gain', 'Very high current gain', 'Low impedance', 'High bandwidth'], ans: 'B', exp: 'Darlington pair gives β_total = β1 × β2 for very high current gain.' },
          { q: 'Thermal runaway is a problem in?', opts: ['MOSFET', 'JFET', 'BJT', 'IGBT'], ans: 'C', exp: 'BJTs have positive temperature coefficient causing destructive feedback.' },
          { q: 'Enhancement MOSFET needs what to conduct?', opts: ['Negative Vgs', 'Positive Vgs > Vth', 'Zero Vgs', 'Negative Vds'], ans: 'B', exp: 'N-channel Enhancement MOSFET needs Vgs > Vth to create channel.' },
          { q: 'Which biasing provides best Q-point stability?', opts: ['Fixed bias', 'Collector feedback', 'Voltage divider', 'Emitter bias'], ans: 'C', exp: 'Voltage divider bias makes base voltage independent of β.' },
          { q: 'Miller effect causes?', opts: ['Increased bandwidth', 'Decreased input capacitance', 'Increased input capacitance', 'No change'], ans: 'C', exp: 'Miller effect multiplies feedback capacitance by (1+Av), increasing input capacitance.' },
        ]
      },
      {
        title: 'Amplifiers & Oscillators',
        questions: [
          { q: 'Barkhausen criterion for oscillation requires loop gain?', opts: ['> 1', '= 1', '< 1', '= 0'], ans: 'B', exp: 'For sustained oscillations, loop gain must be exactly unity (Aβ = 1).' },
          { q: 'Class A amplifier has conduction angle of?', opts: ['180°', '360°', '< 180°', '90°'], ans: 'B', exp: 'Class A conducts for full 360° cycle with max linearity but low efficiency.' },
          { q: 'Which amplifier class has highest efficiency?', opts: ['Class A', 'Class B', 'Class AB', 'Class C'], ans: 'D', exp: 'Class C has highest efficiency (~80%) but worst linearity.' },
          { q: 'Colpitts oscillator uses?', opts: ['RC network', 'LC with tapped capacitor', 'LC with tapped inductor', 'Crystal'], ans: 'B', exp: 'Colpitts uses LC tank with capacitive voltage divider for feedback.' },
          { q: 'Hartley oscillator uses?', opts: ['Tapped capacitor', 'Tapped inductor', 'RC network', 'Crystal'], ans: 'B', exp: 'Hartley uses LC tank with tapped inductor for feedback.' },
          { q: 'Crossover distortion occurs in?', opts: ['Class A', 'Class B', 'Class C', 'Class D'], ans: 'B', exp: 'Class B has dead zone near zero crossing causing crossover distortion.' },
          { q: 'Op-amp in open loop has gain of?', opts: ['1', '100', '1000', '> 100000'], ans: 'D', exp: 'Ideal op-amp has infinite open-loop gain; practical ones have > 100,000.' },
          { q: 'Phase shift oscillator needs how many RC stages?', opts: ['1', '2', '3', '4'], ans: 'C', exp: 'Three RC stages each provide 60° shift for total 180° needed.' },
          { q: 'Wien bridge oscillator frequency is?', opts: ['1/RC', '1/2πRC', '2πRC', 'RC/2π'], ans: 'B', exp: 'Wien bridge oscillates at f = 1/(2πRC).' },
          { q: 'Negative feedback in amplifiers?', opts: ['Increases gain', 'Reduces bandwidth', 'Improves stability', 'Increases distortion'], ans: 'C', exp: 'Negative feedback improves stability, reduces distortion, and increases bandwidth.' },
        ]
      }
    ]
  },
  {
    number: 2,
    title: 'Digital Electronics & VLSI',
    topics: [
      {
        title: 'Number Systems & Boolean Algebra',
        questions: [
          { q: 'Binary equivalent of decimal 13 is?', opts: ['1011', '1101', '1110', '1010'], ans: 'B', exp: '13 = 8+4+1 = 1101 in binary.' },
          { q: 'De Morgan\'s theorem states A̅+B̅ = ?', opts: ['A.B', '(A+B)̅', '(A.B)̅', 'A̅.B̅'], ans: 'D', exp: 'De Morgan: complement of sum = product of complements.' },
          { q: 'Hexadecimal F equals decimal?', opts: ['10', '12', '15', '16'], ans: 'C', exp: 'In hex, F represents 15 in decimal.' },
          { q: 'A + A̅ = ?', opts: ['0', '1', 'A', 'A̅'], ans: 'B', exp: 'OR of a variable with its complement always equals 1.' },
          { q: 'A.A̅ = ?', opts: ['0', '1', 'A', 'A̅'], ans: 'A', exp: 'AND of a variable with its complement always equals 0.' },
          { q: 'BCD code for decimal 9 is?', opts: ['1001', '1010', '1011', '1000'], ans: 'A', exp: '9 in BCD is simply its 4-bit binary: 1001.' },
          { q: 'Gray code for binary 1010 is?', opts: ['1111', '1100', '1110', '1011'], ans: 'A', exp: 'Binary to Gray: MSB same, then XOR adjacent bits. 1010→1111.' },
          { q: '2\'s complement of 0110 is?', opts: ['1001', '1010', '1011', '0101'], ans: 'B', exp: '1\'s complement of 0110 = 1001, add 1 = 1010.' },
          { q: 'Canonical SOP form uses?', opts: ['Maxterms', 'Minterms', 'Both', 'Neither'], ans: 'B', exp: 'Sum of Products (SOP) canonical form uses minterms.' },
          { q: 'K-map is used for?', opts: ['Addition', 'Boolean simplification', 'Multiplication', 'Division'], ans: 'B', exp: 'Karnaugh maps visually simplify Boolean expressions.' },
        ]
      },
      {
        title: 'Logic Gates & Combinational Circuits',
        questions: [
          { q: 'NAND gate is called universal because?', opts: ['Most used', 'Can implement any gate', 'Fastest', 'Cheapest'], ans: 'B', exp: 'NAND (and NOR) can implement any Boolean function.' },
          { q: 'XOR gate output is 1 when inputs are?', opts: ['Same', 'Different', 'Both 0', 'Both 1'], ans: 'B', exp: 'XOR outputs 1 only when inputs are different.' },
          { q: 'A full adder has how many inputs?', opts: ['1', '2', '3', '4'], ans: 'C', exp: 'Full adder has 3 inputs: A, B, and Carry-in.' },
          { q: 'A 4:1 MUX has how many select lines?', opts: ['1', '2', '3', '4'], ans: 'B', exp: '4:1 MUX needs 2 select lines (2² = 4 inputs).' },
          { q: 'Decoder with 3 inputs has how many outputs?', opts: ['3', '6', '8', '16'], ans: 'C', exp: '3-to-8 decoder: 2³ = 8 output lines.' },
          { q: 'Half adder produces?', opts: ['Sum only', 'Carry only', 'Sum and Carry', 'Difference'], ans: 'C', exp: 'Half adder outputs Sum (XOR) and Carry (AND).' },
          { q: 'Priority encoder with 8 inputs needs how many output bits?', opts: ['2', '3', '4', '8'], ans: 'B', exp: '8 inputs need 3 output bits (2³ = 8).' },
          { q: 'Which gate is equivalent to bubbled OR?', opts: ['AND', 'NAND', 'NOR', 'XOR'], ans: 'B', exp: 'By De Morgan\'s, NAND = bubbled OR (inputs inverted then ORed).' },
          { q: 'A comparator compares?', opts: ['Voltage only', 'Two binary numbers', 'Frequency', 'Phase'], ans: 'B', exp: 'Digital comparator compares two binary numbers for equality/greater/less.' },
          { q: 'ROM is basically a?', opts: ['Encoder', 'Decoder', 'MUX', 'Programmable decoder'], ans: 'D', exp: 'ROM implements truth table as a programmable decoder structure.' },
        ]
      },
      {
        title: 'Sequential Circuits & Flip-Flops',
        questions: [
          { q: 'SR flip-flop has invalid state when?', opts: ['S=0,R=0', 'S=0,R=1', 'S=1,R=0', 'S=1,R=1'], ans: 'D', exp: 'S=R=1 is forbidden as it makes output indeterminate.' },
          { q: 'JK flip-flop toggles when?', opts: ['J=0,K=0', 'J=0,K=1', 'J=1,K=0', 'J=1,K=1'], ans: 'D', exp: 'JK flip-flop toggles (complements output) when J=K=1.' },
          { q: 'D flip-flop output follows?', opts: ['Clock only', 'D input at clock edge', 'Previous state', 'Complement'], ans: 'B', exp: 'D flip-flop captures D input value at active clock edge.' },
          { q: 'A 4-bit ring counter has how many states?', opts: ['4', '8', '16', '2'], ans: 'A', exp: 'Ring counter with n bits has exactly n states.' },
          { q: 'Johnson counter with 4 bits has how many states?', opts: ['4', '8', '16', '2'], ans: 'B', exp: 'Johnson (twisted ring) counter: 2n states, so 4 bits = 8 states.' },
          { q: 'Mod-10 counter is called?', opts: ['Binary counter', 'Decade counter', 'Ring counter', 'Johnson counter'], ans: 'B', exp: 'Decade counter counts 0-9 (10 states) then resets.' },
          { q: 'Shift register can be used for?', opts: ['Serial to parallel', 'Parallel to serial', 'Delay', 'All of these'], ans: 'D', exp: 'Shift registers perform serial-parallel conversion and time delay.' },
          { q: 'Asynchronous counter is also called?', opts: ['Synchronous', 'Ripple counter', 'Ring counter', 'Decade counter'], ans: 'B', exp: 'In ripple counter, each flip-flop is clocked by the previous one.' },
          { q: 'T flip-flop with T=1 acts as?', opts: ['Latch', 'Toggle/frequency divider', 'Buffer', 'Inverter'], ans: 'B', exp: 'T=1 makes it toggle every clock, dividing frequency by 2.' },
          { q: 'Master-slave flip-flop eliminates?', opts: ['Propagation delay', 'Race condition', 'Power consumption', 'Setup time'], ans: 'B', exp: 'Master-slave design prevents race-around condition in JK flip-flops.' },
        ]
      }
    ]
  },
  {
    number: 3,
    title: 'Communication Engineering',
    topics: [
      {
        title: 'Analog Modulation (AM & FM)',
        questions: [
          { q: 'AM signal bandwidth is?', opts: ['fm', '2fm', 'fc', 'fc + fm'], ans: 'B', exp: 'AM bandwidth = 2 × maximum modulating frequency.' },
          { q: 'In FM, what remains constant?', opts: ['Frequency', 'Amplitude', 'Phase', 'Wavelength'], ans: 'B', exp: 'FM varies frequency while keeping amplitude constant.' },
          { q: 'Modulation index of AM must be?', opts: ['> 1', '≤ 1', '= 0', '> 2'], ans: 'B', exp: 'AM modulation index m ≤ 1 to avoid overmodulation and distortion.' },
          { q: 'FM is preferred over AM because of?', opts: ['Simplicity', 'Noise immunity', 'Lower bandwidth', 'Lower power'], ans: 'B', exp: 'FM has better noise immunity as information is in frequency, not amplitude.' },
          { q: 'Carson\'s rule for FM bandwidth is?', opts: ['2fm', '2(Δf + fm)', 'Δf', 'Δf/fm'], ans: 'B', exp: 'Carson\'s rule: BW = 2(Δf + fm) where Δf is frequency deviation.' },
          { q: 'Superheterodyne receiver uses?', opts: ['Direct amplification', 'Frequency conversion', 'No amplification', 'Regeneration'], ans: 'B', exp: 'Superheterodyne converts incoming frequency to fixed IF for better selectivity.' },
          { q: 'Standard IF for AM radio is?', opts: ['455 kHz', '10.7 MHz', '70 MHz', '21.4 MHz'], ans: 'A', exp: 'Standard AM broadcast receivers use 455 kHz intermediate frequency.' },
          { q: 'SSB-SC saves bandwidth by?', opts: ['Removing carrier', 'Removing one sideband', 'Removing both sidebands', 'Removing carrier and one sideband'], ans: 'D', exp: 'SSB-SC removes carrier and one sideband, using half the bandwidth of DSB.' },
          { q: 'Pre-emphasis is used in FM to?', opts: ['Boost bass', 'Boost high frequencies before transmission', 'Reduce bandwidth', 'Increase power'], ans: 'B', exp: 'Pre-emphasis boosts high-frequency components to improve SNR after de-emphasis at receiver.' },
          { q: 'Image frequency in superheterodyne is?', opts: ['fs + fIF', 'fs + 2fIF', 'fs - fIF', 'fs - 2fIF'], ans: 'B', exp: 'Image frequency = signal frequency + 2 × IF (for high-side injection).' },
        ]
      },
      {
        title: 'Digital Communication',
        questions: [
          { q: 'Nyquist sampling rate for a 4 kHz signal is?', opts: ['4 kHz', '8 kHz', '16 kHz', '2 kHz'], ans: 'B', exp: 'Nyquist rate = 2 × maximum frequency = 2 × 4 kHz = 8 kHz.' },
          { q: 'PCM stands for?', opts: ['Pulse Code Modulation', 'Phase Change Modulation', 'Pulse Carrier Modulation', 'Phase Code Multiplexing'], ans: 'A', exp: 'PCM = Pulse Code Modulation, converts analog to digital.' },
          { q: 'In QPSK, bits per symbol are?', opts: ['1', '2', '4', '8'], ans: 'B', exp: 'QPSK uses 4 phase states, encoding 2 bits per symbol.' },
          { q: 'Shannon capacity formula is?', opts: ['C = B log₂(1+S/N)', 'C = 2B log₂(M)', 'C = B × S/N', 'C = 2B'], ans: 'A', exp: 'Shannon: C = B log₂(1 + S/N) gives maximum channel capacity.' },
          { q: 'ASK is most affected by?', opts: ['Phase noise', 'Amplitude noise', 'Frequency drift', 'Delay'], ans: 'B', exp: 'ASK carries information in amplitude, making it vulnerable to amplitude noise.' },
          { q: 'Which modulation is most bandwidth efficient?', opts: ['BPSK', 'QPSK', '16-QAM', '64-QAM'], ans: 'D', exp: '64-QAM encodes 6 bits/symbol, giving highest spectral efficiency.' },
          { q: 'Hamming distance for single error correction must be?', opts: ['1', '2', '3', '4'], ans: 'C', exp: 'Minimum Hamming distance of 3 allows single error correction.' },
          { q: 'Eye diagram is used to evaluate?', opts: ['Power', 'ISI and signal quality', 'Frequency', 'Phase'], ans: 'B', exp: 'Eye diagram shows inter-symbol interference and overall link quality.' },
          { q: 'In TDM, channels share?', opts: ['Frequency band', 'Time slots', 'Code', 'Space'], ans: 'B', exp: 'Time Division Multiplexing assigns different time slots to channels.' },
          { q: 'Bit rate of standard PCM telephone is?', opts: ['32 kbps', '64 kbps', '128 kbps', '56 kbps'], ans: 'B', exp: '8000 samples/sec × 8 bits/sample = 64 kbps for standard PCM telephony.' },
        ]
      },
      {
        title: 'Antenna & Wave Propagation',
        questions: [
          { q: 'Half-wave dipole antenna length for 300 MHz is?', opts: ['1m', '0.5m', '2m', '0.25m'], ans: 'B', exp: 'λ = c/f = 3×10⁸/300×10⁶ = 1m. Half-wave = 0.5m.' },
          { q: 'Yagi antenna is a type of?', opts: ['Omnidirectional', 'Directional', 'Isotropic', 'Loop'], ans: 'B', exp: 'Yagi-Uda is a directional antenna with high gain in one direction.' },
          { q: 'Antenna gain is measured in?', opts: ['Watts', 'dBi', 'Hertz', 'Ohms'], ans: 'B', exp: 'Antenna gain is measured in dBi (relative to isotropic radiator).' },
          { q: 'Sky wave propagation uses?', opts: ['Ground surface', 'Ionosphere reflection', 'Line of sight', 'Satellite'], ans: 'B', exp: 'Sky waves reflect off ionosphere layers for long-distance HF communication.' },
          { q: 'Line of sight range depends on?', opts: ['Frequency only', 'Antenna heights', 'Modulation', 'Power only'], ans: 'B', exp: 'LOS range ≈ √(2×R×h) depends primarily on antenna heights.' },
          { q: 'Radiation resistance of half-wave dipole is?', opts: ['50Ω', '73Ω', '100Ω', '300Ω'], ans: 'B', exp: 'Half-wave dipole has radiation resistance of approximately 73 ohms.' },
          { q: 'Parabolic dish antenna gain increases with?', opts: ['Lower frequency', 'Larger diameter', 'Shorter feed', 'Less curvature'], ans: 'B', exp: 'Gain ∝ (πD/λ)², so larger diameter increases gain.' },
          { q: 'Ground wave attenuation increases with?', opts: ['Lower frequency', 'Higher frequency', 'Distance only', 'Antenna height'], ans: 'B', exp: 'Ground wave attenuation increases with frequency due to surface losses.' },
          { q: 'VSWR of 1:1 means?', opts: ['Total reflection', 'Perfect match', 'Open circuit', 'Short circuit'], ans: 'B', exp: 'VSWR 1:1 means zero reflection — perfect impedance match.' },
          { q: 'Friis equation relates to?', opts: ['Antenna gain', 'Free-space path loss', 'Impedance', 'Bandwidth'], ans: 'B', exp: 'Friis equation calculates received power considering free-space path loss.' },
        ]
      }
    ]
  },
  {
    number: 4,
    title: 'Network Theory & Measurements',
    topics: [
      {
        title: 'Network Theorems',
        questions: [
          { q: 'Thevenin equivalent consists of?', opts: ['Current source + parallel R', 'Voltage source + series R', 'Voltage source only', 'Resistance only'], ans: 'B', exp: 'Thevenin: voltage source (Vth) in series with resistance (Rth).' },
          { q: 'Norton equivalent consists of?', opts: ['Current source + parallel R', 'Voltage source + series R', 'Current source only', 'Resistance only'], ans: 'A', exp: 'Norton: current source (In) in parallel with resistance (Rn).' },
          { q: 'Superposition theorem applies to?', opts: ['Non-linear circuits', 'Linear circuits only', 'All circuits', 'DC only'], ans: 'B', exp: 'Superposition applies only to linear circuits with multiple sources.' },
          { q: 'Maximum power transfer occurs when?', opts: ['RL = 0', 'RL = Rs', 'RL = ∞', 'RL = 2Rs'], ans: 'B', exp: 'Maximum power is delivered when load resistance equals source resistance.' },
          { q: 'KVL is based on conservation of?', opts: ['Charge', 'Energy', 'Mass', 'Momentum'], ans: 'B', exp: 'Kirchhoff\'s Voltage Law is based on conservation of energy around a loop.' },
          { q: 'KCL states that at any node?', opts: ['ΣV = 0', 'ΣI = 0', 'ΣP = 0', 'ΣR = 0'], ans: 'B', exp: 'KCL: sum of currents entering a node equals sum leaving (ΣI = 0).' },
          { q: 'Reciprocity theorem applies to?', opts: ['Active networks', 'Bilateral networks', 'Non-linear networks', 'All networks'], ans: 'B', exp: 'Reciprocity applies to bilateral (linear passive) networks.' },
          { q: 'Millman\'s theorem is useful for?', opts: ['Series circuits', 'Parallel voltage sources', 'Single source', 'Non-linear circuits'], ans: 'B', exp: 'Millman\'s theorem simplifies parallel branches with voltage sources.' },
          { q: 'In a balanced Wheatstone bridge, galvanometer shows?', opts: ['Maximum current', 'Zero current', 'Half current', 'Reverse current'], ans: 'B', exp: 'When bridge is balanced (R1/R2 = R3/R4), no current flows through galvanometer.' },
          { q: 'Mesh analysis is based on?', opts: ['KCL', 'KVL', 'Ohm\'s law only', 'Norton theorem'], ans: 'B', exp: 'Mesh analysis applies KVL to independent loops.' },
        ]
      },
      {
        title: 'AC Circuits & Resonance',
        questions: [
          { q: 'At resonance in series RLC, impedance is?', opts: ['Maximum', 'Minimum (= R)', 'Zero', 'Infinite'], ans: 'B', exp: 'At resonance XL = XC cancel, leaving only R (minimum impedance).' },
          { q: 'Power factor of purely resistive circuit is?', opts: ['0', '0.5', '1', 'Infinity'], ans: 'C', exp: 'Purely resistive: voltage and current in phase, PF = cos(0°) = 1.' },
          { q: 'Resonant frequency formula is?', opts: ['1/2πLC', '1/2π√(LC)', '2π√(LC)', '√(LC)/2π'], ans: 'B', exp: 'Resonant frequency f₀ = 1/(2π√(LC)).' },
          { q: 'Quality factor Q represents?', opts: ['Power loss', 'Selectivity/sharpness', 'Resistance', 'Capacitance'], ans: 'B', exp: 'Q factor indicates how selective/sharp the resonance peak is.' },
          { q: 'In parallel RLC at resonance, impedance is?', opts: ['Minimum', 'Maximum', 'Zero', 'Equal to R'], ans: 'B', exp: 'Parallel RLC has maximum impedance at resonance.' },
          { q: 'RMS value of sinusoidal voltage is?', opts: ['Vpeak', 'Vpeak/2', 'Vpeak/√2', '2×Vpeak'], ans: 'C', exp: 'RMS = Vpeak/√2 ≈ 0.707 × Vpeak for sinusoidal waveform.' },
          { q: 'Reactive power is measured in?', opts: ['Watts', 'VAR', 'VA', 'Joules'], ans: 'B', exp: 'Reactive power is measured in Volt-Ampere Reactive (VAR).' },
          { q: 'Bandwidth of series RLC circuit is?', opts: ['R/L', 'L/R', '1/RC', 'LC'], ans: 'A', exp: 'Bandwidth BW = R/L for series RLC circuit.' },
          { q: 'Leading power factor means?', opts: ['Inductive load', 'Capacitive load', 'Resistive load', 'No load'], ans: 'B', exp: 'Current leads voltage in capacitive circuits (leading PF).' },
          { q: 'Average power in AC circuit is?', opts: ['VI', 'VI cosφ', 'VI sinφ', 'V²/R'], ans: 'B', exp: 'Real (average) power P = VI cosφ where φ is phase angle.' },
        ]
      },
      {
        title: 'Electronic Instruments',
        questions: [
          { q: 'CRO measures?', opts: ['Current only', 'Voltage waveforms', 'Resistance only', 'Power only'], ans: 'B', exp: 'Cathode Ray Oscilloscope displays voltage waveforms vs time.' },
          { q: 'Accuracy of a DMM is typically?', opts: ['±10%', '±5%', '±0.5%', '±50%'], ans: 'C', exp: 'Digital multimeters typically have accuracy of ±0.5% or better.' },
          { q: 'Lissajous pattern is used to measure?', opts: ['Voltage', 'Frequency & phase', 'Current', 'Power'], ans: 'B', exp: 'Lissajous figures on CRO determine frequency ratio and phase difference.' },
          { q: 'Signal generator produces?', opts: ['DC only', 'Test signals of known frequency', 'Random noise', 'Pulses only'], ans: 'B', exp: 'Signal generators produce precise test signals at known frequencies.' },
          { q: 'Spectrum analyzer displays?', opts: ['Time domain', 'Frequency domain', 'Phase domain', 'Power domain'], ans: 'B', exp: 'Spectrum analyzer shows signal amplitude vs frequency.' },
          { q: 'Loading effect is reduced by?', opts: ['Low input impedance', 'High input impedance', 'High current', 'Low voltage'], ans: 'B', exp: 'High input impedance draws minimal current, reducing loading effect.' },
          { q: 'Logic analyzer is used for?', opts: ['Analog signals', 'Digital signal debugging', 'Power measurement', 'Frequency measurement'], ans: 'B', exp: 'Logic analyzer captures and displays multiple digital signals simultaneously.' },
          { q: 'Function generator can produce?', opts: ['Sine only', 'Square only', 'Sine, square, triangle', 'DC only'], ans: 'C', exp: 'Function generators produce multiple waveforms: sine, square, triangle, etc.' },
          { q: 'Network analyzer measures?', opts: ['S-parameters', 'Current', 'Voltage only', 'Temperature'], ans: 'A', exp: 'Network analyzers measure S-parameters (reflection/transmission characteristics).' },
          { q: 'True RMS meter accurately measures?', opts: ['DC only', 'Pure sine only', 'Any waveform shape', 'Pulse only'], ans: 'C', exp: 'True RMS meters calculate actual RMS regardless of waveform shape.' },
        ]
      }
    ]
  },
  {
    number: 5,
    title: 'Microprocessors & Embedded Systems',
    topics: [
      {
        title: '8085 Microprocessor',
        questions: [
          { q: '8085 is a?', opts: ['4-bit', '8-bit', '16-bit', '32-bit'], ans: 'B', exp: '8085 is an 8-bit microprocessor with 8-bit data bus.' },
          { q: '8085 has how many address lines?', opts: ['8', '16', '20', '32'], ans: 'B', exp: '8085 has 16 address lines (A0-A15) for 64KB memory.' },
          { q: 'Stack in 8085 grows?', opts: ['Upward', 'Downward', 'Both ways', 'No direction'], ans: 'B', exp: 'Stack grows downward — SP decrements on PUSH, increments on POP.' },
          { q: 'HLT instruction does?', opts: ['Reset', 'Stops execution', 'Jump', 'Loop'], ans: 'B', exp: 'HLT halts processor until interrupt or reset occurs.' },
          { q: 'Which is not a flag in 8085?', opts: ['Zero', 'Carry', 'Overflow', 'Parity'], ans: 'C', exp: '8085 has S, Z, AC, P, CY flags — no Overflow flag.' },
          { q: 'MVI A, 32H is?', opts: ['1-byte', '2-byte', '3-byte', '4-byte'], ans: 'B', exp: 'MVI is 2 bytes: opcode + 8-bit immediate data.' },
          { q: 'LXI H instruction loads?', opts: ['Accumulator', 'HL register pair', 'Memory', 'Stack pointer'], ans: 'B', exp: 'LXI H loads 16-bit immediate data into HL register pair.' },
          { q: 'RST 7 pushes PC and jumps to?', opts: ['0000H', '0038H', '0020H', '0008H'], ans: 'B', exp: 'RST n jumps to address n×8. RST 7 = 7×8 = 56 = 0038H.' },
          { q: 'INTR is?', opts: ['Non-maskable', 'Maskable', 'Software interrupt', 'Edge-triggered'], ans: 'B', exp: 'INTR is the general maskable interrupt in 8085.' },
          { q: 'Clock frequency of 8085 is?', opts: ['1 MHz', '3.072 MHz', '5 MHz', '8 MHz'], ans: 'B', exp: '8085 operates at 3.072 MHz (half of 6.144 MHz crystal).' },
        ]
      },
      {
        title: '8051 Microcontroller',
        questions: [
          { q: '8051 has how many I/O ports?', opts: ['2', '3', '4', '8'], ans: 'C', exp: '8051 has 4 I/O ports: P0, P1, P2, P3 (32 pins total).' },
          { q: '8051 internal RAM size is?', opts: ['64 bytes', '128 bytes', '256 bytes', '1 KB'], ans: 'B', exp: '8051 has 128 bytes of internal RAM (00H to 7FH).' },
          { q: '8051 has how many timers?', opts: ['1', '2', '3', '4'], ans: 'B', exp: '8051 has 2 timers: Timer 0 and Timer 1.' },
          { q: 'SJMP is?', opts: ['Long jump', 'Short jump (relative)', 'Absolute jump', 'Indirect jump'], ans: 'B', exp: 'SJMP is short jump using 8-bit relative offset (-128 to +127).' },
          { q: '8051 serial port operates in how many modes?', opts: ['1', '2', '3', '4'], ans: 'D', exp: '8051 UART has 4 modes: Mode 0-3 with different baud rates and formats.' },
          { q: 'MOV A, #55H means?', opts: ['Move 55H from memory to A', 'Load immediate 55H into A', 'Move A to memory 55H', 'Add 55H to A'], ans: 'B', exp: '# indicates immediate addressing — loads constant 55H directly into A.' },
          { q: '8051 program memory can be?', opts: ['Internal only', 'External only', 'Internal or external', 'No program memory'], ans: 'C', exp: '8051 supports internal (4KB) or external (up to 64KB) program memory.' },
          { q: 'How many interrupt sources in 8051?', opts: ['3', '4', '5', '6'], ans: 'C', exp: '5 interrupt sources: 2 external, 2 timer, 1 serial port.' },
          { q: 'Bit-addressable RAM in 8051 is?', opts: ['00-1FH', '20H-2FH', '30H-7FH', '80H-FFH'], ans: 'B', exp: 'Byte addresses 20H-2FH (16 bytes = 128 bits) are bit-addressable.' },
          { q: 'PSW register contains?', opts: ['Program counter', 'Flags and register bank select', 'Stack pointer', 'Timer control'], ans: 'B', exp: 'Program Status Word has flags (CY, AC, OV, P) and RS1:RS0 for bank select.' },
        ]
      },
      {
        title: 'Embedded Systems Basics',
        questions: [
          { q: 'RTOS stands for?', opts: ['Real Time Output System', 'Real Time Operating System', 'Random Time OS', 'Reduced Time OS'], ans: 'B', exp: 'RTOS = Real Time Operating System for time-critical applications.' },
          { q: 'Watchdog timer is used to?', opts: ['Keep time', 'Reset system on hang', 'Generate PWM', 'Count events'], ans: 'B', exp: 'Watchdog timer resets the system if software fails to periodically clear it.' },
          { q: 'I2C uses how many wires?', opts: ['1', '2', '3', '4'], ans: 'B', exp: 'I2C uses 2 wires: SDA (data) and SCL (clock).' },
          { q: 'SPI is?', opts: ['Single wire', 'Two wire', 'Full duplex 4-wire', 'Wireless'], ans: 'C', exp: 'SPI uses 4 wires: MOSI, MISO, SCK, SS for full-duplex communication.' },
          { q: 'Flash memory is?', opts: ['Volatile', 'Non-volatile', 'Read-only', 'Static'], ans: 'B', exp: 'Flash is non-volatile — retains data without power, and is reprogrammable.' },
          { q: 'PWM is used for?', opts: ['Data transmission', 'Analog output/motor control', 'Memory access', 'Interrupt handling'], ans: 'B', exp: 'PWM (Pulse Width Modulation) controls average power for motors, LEDs, etc.' },
          { q: 'ADC converts?', opts: ['Digital to analog', 'Analog to digital', 'AC to DC', 'DC to AC'], ans: 'B', exp: 'ADC converts continuous analog signals to discrete digital values.' },
          { q: 'UART communication is?', opts: ['Synchronous', 'Asynchronous', 'Both', 'Neither'], ans: 'B', exp: 'UART is asynchronous — no shared clock, uses start/stop bits.' },
          { q: 'DMA stands for?', opts: ['Direct Memory Access', 'Digital Memory Allocation', 'Dynamic Memory Array', 'Dual Mode Access'], ans: 'A', exp: 'DMA allows peripherals to access memory directly without CPU intervention.' },
          { q: 'Interrupt latency is?', opts: ['Time between interrupts', 'Time from interrupt to ISR start', 'ISR execution time', 'Total system time'], ans: 'B', exp: 'Interrupt latency = time from interrupt assertion to first ISR instruction.' },
        ]
      }
    ]
  }
];

const bulkPracticeQuestions = Array.from({ length: 100 }, (_, i) => {
  const n = i + 1;
  const correct = n + 1;
  return {
    q: `Q${n}: What is ${n} + 1?`,
    opts: [`${n}`, `${correct}`, `${correct + 1}`, `${correct + 2}`],
    ans: 'B',
    exp: `${n} + 1 = ${correct}.`
  };
});

chaptersData.push({
  number: 6,
  title: 'Practice Tests',
  topics: [
    {
      title: '100 Question Scroll Test',
      questions: bulkPracticeQuestions
    }
  ]
});

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await Chapter.deleteMany({});
    await Topic.deleteMany({});
    await Question.deleteMany({});
    await Test.deleteMany({});
    console.log('Cleared existing data');

    for (const chData of chaptersData) {
      const chapter = await Chapter.create({
        number: chData.number,
        title: chData.title,
        topics: []
      });

      for (const topicData of chData.topics) {
        const topic = await Topic.create({
          title: topicData.title,
          chapter: chapter._id
        });

        chapter.topics.push(topic._id);

        const questionsToInsert = topicData.questions.map((q, idx) => ({
          questionText: q.q,
          options: [
            { id: 'A', text: q.opts[0] },
            { id: 'B', text: q.opts[1] },
            { id: 'C', text: q.opts[2] },
            { id: 'D', text: q.opts[3] }
          ],
          correctAnswer: q.ans,
          explanation: q.exp,
          topic: topic._id,
          chapter: chapter._id,
          difficulty: idx < 4 ? 'easy' : idx < 7 ? 'medium' : 'hard',
          marks: 1
        }));

        const questions = await Question.insertMany(questionsToInsert);

        const qCount = questions.length;
        await Test.create({
          title: topicData.title,
          topic: topic._id,
          chapter: chapter._id,
          questions: questions.map(q => q._id),
          duration: qCount,
          totalMarks: qCount,
          totalQuestions: qCount,
          randomizeQuestions: true
        });

        console.log(`  ✓ ${topicData.title} (${questions.length} questions)`);
      }

      await chapter.save();
      console.log(`Chapter ${chData.number}: ${chData.title}`);
    }

    console.log('\n✅ Seeding completed!');
    console.log(`   ${chaptersData.length} Chapters`);
    console.log(`   ${chaptersData.reduce((s, c) => s + c.topics.length, 0)} Topics`);
    console.log(`   ${chaptersData.reduce((s, c) => s + c.topics.reduce((t, tp) => t + tp.questions.length, 0), 0)} Questions`);
    console.log('\nIncludes "100 Question Scroll Test" under Practice Tests chapter');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
