/* =========================================================
   Senior Project Demo Data
   Generated from corrected MATLAB model logic
========================================================= */

(function () {
  const g = 9.81;
  const rho = 1.18;

  /* =========================================================
     Formatting Helpers
  ========================================================= */

  function round(value, digits = 3) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  function toLabelArray(values, digits = 2) {
    return values.map((v) => round(v, digits).toFixed(digits).replace(/\.?0+$/, ""));
  }

  function replaceLeadingNaNWithFirstValid(arr) {
    const out = arr.slice();
    const firstValid = out.find((v) => Number.isFinite(v));
    if (!Number.isFinite(out[0]) && Number.isFinite(firstValid)) {
      out[0] = firstValid;
    }
    return out;
  }

  function makeMetricRow(label, unit, values) {
    return {
      label,
      unit,
      values: {
        zr26Base: values.zr26Base,
        zr26Aero: values.zr26Aero,
        zr25Aero: values.zr25Aero
      }
    };
  }

  function getArrayByStep(arr, step = 1) {
    const out = [];
    for (let i = 0; i < arr.length; i += step) out.push(arr[i]);
    if (out[out.length - 1] !== arr[arr.length - 1]) {
      out.push(arr[arr.length - 1]);
    }
    return out;
  }

  /* =========================================================
     Vehicle Definitions
  ========================================================= */

  const longitudinalVehicles = {
    zr26Base: {
      key: "zr26Base",
      name: "ZR26 Base",
      dmass: 72.73,
      mass: 204.57 + 72.73,
      mu: 1.4,
      Crr: 0.015,
      area: 0.66,
      Cd: 0.388,
      Cl: 0.244,
      maxPower: 80e3,
      forceCap: 3500,
      wheelbase: 1.528,
      cgHeight: 0.28,
      cp: 0.50
    },

    zr26Aero: {
      key: "zr26Aero",
      name: "ZR26 Aero",
      dmass: 72.73,
      aeromass: 11.34,
      mass: 204.57 + 72.73 + 11.34,
      mu: 1.4,
      Crr: 0.015,
      area: 1.06,
      Cd: 1.33,
      Cl: 2.98,
      maxPower: 80e3,
      forceCap: 3500,
      wheelbase: 1.528,
      cgHeight: 0.28,
      cp: 0.67
    },

    zr25Aero: {
      key: "zr25Aero",
      name: "ZR25 Aero",
      dmass: 72.73,
      aeromass: 11.34,
      mass: 238.66 + 72.73 + 11.34,
      mu: 1.4,
      Crr: 0.015,
      area: 1.06,
      Cd: 1.26,
      Cl: 2.15,
      maxPower: 80e3,
      forceCap: 3500,
      wheelbase: 1.53,
      cgHeight: 0.291,
      cp: 0.47
    }
  };

  Object.values(longitudinalVehicles).forEach((car) => {
    const weight = car.mass * g;
    car.staticFrontLoad = weight * 0.48;
    car.staticRearLoad = weight * 0.52;
  });

  const commonLat = {
    g: 9.81,
    rho: 1.18,
    mu_lat: 1.4,
    L: 1.528,
    mass_d: 72.73,
    tf: 1.22,
    tr: 1.20
  };

  const lateralVehicles = {
    zr26Base: {
      key: "zr26Base",
      name: "ZR26 Base",
      mass_v: 204.57,
      m: 204.57 + commonLat.mass_d,
      Wfs_perc: 0.48,
      A: 0.66,
      Cd: 0.388,
      Cl: 0.244,
      cp: 0.50,
      L: 1.528
    },

    zr26Aero: {
      key: "zr26Aero",
      name: "ZR26 Aero",
      mass_v: 204.57 + 11.34,
      m: 204.57 + 11.34 + commonLat.mass_d,
      Wfs_perc: 0.48,
      A: 1.06,
      Cd: 1.33,
      Cl: 2.98,
      cp: 0.67,
      L: 1.528
    },

    zr25Aero: {
      key: "zr25Aero",
      name: "ZR25 Aero",
      mass_v: 238.66 + 11.34,
      m: 238.66 + 11.34 + commonLat.mass_d,
      Wfs_perc: 0.48,
      A: 1.06,
      Cd: 1.26,
      Cl: 2.15,
      cp: 0.47,
      L: 1.53
    }
  };

  Object.values(lateralVehicles).forEach((car) => {
    car.W = car.m * commonLat.g;
    car.Wfs = car.W * car.Wfs_perc;
    car.Wrs = car.W * (1 - car.Wfs_perc);
    car.b = car.L * (1 - car.Wfs_perc);
    car.c = car.L * car.Wfs_perc;
  });

  /* =========================================================
     Longitudinal Model
  ========================================================= */

  function runLongitudinal(car, dt = 0.002, Vmax = 30 * 0.44704, Vstop = 0) {
    const m = car.mass;
    const W = m * g;

    function aeroTerms(V) {
      const drag = 0.5 * rho * V * V * car.area * car.Cd;
      const downforce = 0.5 * rho * V * V * car.area * car.Cl;
      const totalNormal = W + downforce;
      return { drag, downforce, totalNormal };
    }

    let time = 0;
    let position = 0;
    let velocity = 0;

    const tAcc = [time];
    const xAcc = [position];
    const vAcc = [velocity];
    const aAcc = [NaN];
    const WfAcc = [car.staticFrontLoad];
    const WrAcc = [car.staticRearLoad];

    while (velocity < Vmax) {
      const { drag, downforce, totalNormal } = aeroTerms(velocity);

      const driveForce = Math.min(
        car.mu * totalNormal,
        Math.min(car.maxPower / Math.max(velocity, 1), car.forceCap)
      );

      const acceleration = (driveForce - drag - car.Crr * totalNormal) / m;
      const newVelocity = Math.min(Vmax, velocity + acceleration * dt);
      position += 0.5 * (velocity + newVelocity) * dt;
      velocity = newVelocity;
      time += dt;

      const loadTransfer = (m * acceleration * car.cgHeight) / car.wheelbase;
      const frontLoad = car.staticFrontLoad + car.cp * downforce - loadTransfer;
      const rearLoad = car.staticRearLoad + (1 - car.cp) * downforce + loadTransfer;

      tAcc.push(time);
      xAcc.push(position);
      vAcc.push(velocity);
      aAcc.push(acceleration);
      WfAcc.push(frontLoad);
      WrAcc.push(rearLoad);
    }

    const tStart = time;
    const xStart = position;

    const tBrake = [0];
    const xBrake = [0];
    const vBrake = [velocity];
    const aBrake = [NaN];
    const WfBrake = [car.staticFrontLoad];
    const WrBrake = [car.staticRearLoad];

    while (velocity > Vstop) {
      const { drag, downforce, totalNormal } = aeroTerms(velocity);

      const brakeForce = car.mu * totalNormal;
      const acceleration = -(brakeForce + drag + car.Crr * totalNormal) / m;
      const newVelocity = Math.max(Vstop, velocity + acceleration * dt);

      position += 0.5 * (velocity + newVelocity) * dt;
      velocity = newVelocity;
      time += dt;

      const loadTransfer = (m * acceleration * car.cgHeight) / car.wheelbase;
      const frontLoad = car.staticFrontLoad + car.cp * downforce - loadTransfer;
      const rearLoad = car.staticRearLoad + (1 - car.cp) * downforce + loadTransfer;

      tBrake.push(time - tStart);
      xBrake.push(position - xStart);
      vBrake.push(velocity);
      aBrake.push(acceleration);
      WfBrake.push(frontLoad);
      WrBrake.push(rearLoad);
    }

    const maxAero = aeroTerms(Vmax);

    return {
      name: car.name,
      t_acc: tAcc,
      x_acc: xAcc,
      v_acc: vAcc,
      a_acc: replaceLeadingNaNWithFirstValid(aAcc),
      Wf_acc: WfAcc,
      Wr_acc: WrAcc,

      t_brake: tBrake,
      x_brake: xBrake,
      v_brake: vBrake,
      a_brake: replaceLeadingNaNWithFirstValid(aBrake),
      Wf_brake: WfBrake,
      Wr_brake: WrBrake,

      t_acc_end: tAcc[tAcc.length - 1],
      x_acc_end: xAcc[xAcc.length - 1],
      t_brake_end: tBrake[tBrake.length - 1],
      x_brake_end: xBrake[xBrake.length - 1],

      max_downforce_N: maxAero.downforce,
      max_drag_N: maxAero.drag,
      peak_accel_g: Math.max(...replaceLeadingNaNWithFirstValid(aAcc)) / g,
      peak_brake_g: Math.min(...replaceLeadingNaNWithFirstValid(aBrake)) / g,
      max_delta_W_front_N: Math.max(...WfBrake) - car.staticFrontLoad
    };
  }

  /* =========================================================
     Lateral Model
  ========================================================= */

  function getTireStiffness(FzN) {
    const FzLbs = FzN * 0.224809;
    const CAlphaLbs =
      5e-6 * FzLbs ** 3 -
      0.0053 * FzLbs ** 2 +
      1.695 * FzLbs -
      0.9749;

    const CaNDeg = Math.abs((CAlphaLbs / 2.2) * 9.81);
    return CaNDeg * (180 / Math.PI);
  }

  function runLateralSweep(car) {
    const Tfinal = 10;
    const dt = 0.05;
    const steps = Math.round(Tfinal / dt) + 1;
    const time = Array.from({ length: steps }, (_, i) => i * dt);

    const deltaMinDeg = (commonLat.L / 30) * (180 / Math.PI);
    const deltaMaxDeg = (commonLat.L / 4) * (180 / Math.PI);

    const deltaMinRad = deltaMinDeg * (Math.PI / 180);
    const deltaMaxRad = deltaMaxDeg * (Math.PI / 180);

    const deltaInputRad = Array.from(
      { length: steps },
      (_, i) => deltaMinRad + ((deltaMaxRad - deltaMinRad) * i) / (steps - 1)
    );

    const out = {
      time,
      delta_deg: deltaInputRad.map((d) => d * (180 / Math.PI)),
      V_max: [],
      R: [],
      ay_g: [],
      Fzf: [],
      Fzr: [],
      Ca_f: [],
      Ca_r: [],
      alpha_f_deg: [],
      alpha_r_deg: [],
      beta_deg: [],
      r_degps: [],
      K_usegrad: [],
      yaw_gain: [],
      ay_gain: []
    };

    deltaInputRad.forEach((delta, i) => {
      const R = Math.abs(delta) < (0.1 * Math.PI) / 180 ? 1e5 : car.L / delta;
      out.R.push(R);

      const aeroTerm = 0.5 * commonLat.mu_lat * commonLat.rho * car.A * car.Cl;
      const denom = car.m / Math.abs(R) - aeroTerm;

      const V =
        denom > 0
          ? Math.sqrt((commonLat.mu_lat * car.W) / denom)
          : 115 / 3.6;

      out.V_max.push(V);

      const Laero = 0.5 * commonLat.rho * V * V * car.A * car.Cl;
      const ay = (V * V) / R;

      out.ay_g.push(ay / commonLat.g);

      const Fzf = car.Wfs + Laero * car.cp;
      const Fzr = car.Wrs + Laero * (1 - car.cp);

      out.Fzf.push(Fzf);
      out.Fzr.push(Fzr);

      const Caf = 2 * getTireStiffness(Fzf / 2);
      const Car = 2 * getTireStiffness(Fzr / 2);

      out.Ca_f.push(Caf);
      out.Ca_r.push(Car);

      const FyfReq = car.m * ay * (car.c / car.L);
      const FyrReq = car.m * ay * (car.b / car.L);

      const alphaF = FyfReq / Caf;
      const alphaR = FyrReq / Car;

      out.alpha_f_deg.push(alphaF * (180 / Math.PI));
      out.alpha_r_deg.push(alphaR * (180 / Math.PI));

      const r = V / R;
      out.r_degps.push(r * (180 / Math.PI));

      const beta = car.c / R - alphaR;
      out.beta_deg.push(beta * (180 / Math.PI));

      if (Math.abs(ay) > 0.1) {
        out.K_usegrad.push(
          (out.alpha_f_deg[i] - out.alpha_r_deg[i]) / out.ay_g[i]
        );
      } else {
        out.K_usegrad.push(0);
      }

      if (Math.abs(out.delta_deg[i]) > 0.1) {
        out.yaw_gain.push(out.r_degps[i] / out.delta_deg[i]);
        out.ay_gain.push(out.ay_g[i] / out.delta_deg[i]);
      } else {
        out.yaw_gain.push(0);
        out.ay_gain.push(0);
      }
    });

    return out;
  }

  function runHandlingCurve(car) {
    const Rconst = 15.25;
    const numSteps = 500;
    const VmaxTheoretical = Math.sqrt(2.5 * commonLat.g * Rconst);
    const Vsweep = Array.from(
      { length: numSteps },
      (_, i) => 1.0 + ((VmaxTheoretical - 1.0) * i) / (numSteps - 1)
    );

    const ayG = [];
    const deltaLinDeg = [];

    for (let i = 0; i < Vsweep.length; i += 1) {
      const V = Vsweep[i];
      const ay = (V * V) / Rconst;
      const ayg = ay / commonLat.g;

      const Laero = 0.5 * commonLat.rho * V * V * car.A * car.Cl;
      const Fzf = car.Wfs + Laero * car.cp;
      const Fzr = car.Wrs + Laero * (1 - car.cp);

      const FmaxF = commonLat.mu_lat * Fzf;
      const FmaxR = commonLat.mu_lat * Fzr;

      const FyfReq = car.m * ay * (car.c / car.L);
      const FyrReq = car.m * ay * (car.b / car.L);

      if (FyfReq >= 0.995 * FmaxF || FyrReq >= 0.995 * FmaxR) {
        break;
      }

      const CaF = 2 * getTireStiffness(Fzf / 2);
      const CaR = 2 * getTireStiffness(Fzr / 2);

      const alphaFLin = FyfReq / CaF;
      const alphaRLin = FyrReq / CaR;

      const deltaLinRad = car.L / Rconst + alphaFLin - alphaRLin;

      ayG.push(ayg);
      deltaLinDeg.push(deltaLinRad * (180 / Math.PI));
    }

    const { slope, intercept } = linearFit(ayG, deltaLinDeg);
    const deltaFitLine = ayG.map((x) => slope * x + intercept);

    return {
      ay_g: ayG,
      ay_valid: ayG,
      delta_lin_deg: deltaLinDeg,
      delta_fit_line: deltaFitLine,
      K_fit: slope
    };
  }

  function linearFit(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0);
    const sumXX = x.reduce((a, xi) => a + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }
function deriveLateralPathFromSweep(sweep) {
  const n = sweep.time.length;
  const x = new Array(n).fill(0);
  const y = new Array(n).fill(0);
  const yaw_deg = new Array(n).fill(0);
  const heading_deg = new Array(n).fill(0);

  for (let i = 1; i < n; i += 1) {
    const dt = sweep.time[i] - sweep.time[i - 1];

    const r1 = (sweep.r_degps[i - 1] * Math.PI) / 180;
    const r2 = (sweep.r_degps[i] * Math.PI) / 180;
    const yawPrev = (yaw_deg[i - 1] * Math.PI) / 180;
    const yawNow = yawPrev + 0.5 * (r1 + r2) * dt;

    yaw_deg[i] = yawNow * (180 / Math.PI);

    const beta1 = (sweep.beta_deg[i - 1] * Math.PI) / 180;
    const beta2 = (sweep.beta_deg[i] * Math.PI) / 180;
    const v1 = sweep.V_max[i - 1];
    const v2 = sweep.V_max[i];

    const h1 = yawPrev + beta1;
    const h2 = yawNow + beta2;

    heading_deg[i] = h2 * (180 / Math.PI);

    const vx1 = v1 * Math.cos(h1);
    const vy1 = v1 * Math.sin(h1);
    const vx2 = v2 * Math.cos(h2);
    const vy2 = v2 * Math.sin(h2);

    x[i] = x[i - 1] + 0.5 * (vx1 + vx2) * dt;
    y[i] = y[i - 1] + 0.5 * (vy1 + vy2) * dt;
  }

  const minX = Math.min(...x);
  const minY = Math.min(...y);

  return {
    x: x.map((v) => round(v - minX, 4)),
    y: y.map((v) => round(v - minY, 4)),
    yaw_deg: yaw_deg.map((v) => round(v, 4)),
    heading_deg: heading_deg.map((v) => round(v, 4))
  };
}
  /* =========================================================
     Run Models
  ========================================================= */

  const longResults = {
    zr26Base: runLongitudinal(longitudinalVehicles.zr26Base),
    zr26Aero: runLongitudinal(longitudinalVehicles.zr26Aero),
    zr25Aero: runLongitudinal(longitudinalVehicles.zr25Aero)
  };

  const latSweepResults = {
    zr26Base: runLateralSweep(lateralVehicles.zr26Base),
    zr26Aero: runLateralSweep(lateralVehicles.zr26Aero),
    zr25Aero: runLateralSweep(lateralVehicles.zr25Aero)
  };
const latPathResults = {
  zr26Base: deriveLateralPathFromSweep(latSweepResults.zr26Base),
  zr26Aero: deriveLateralPathFromSweep(latSweepResults.zr26Aero),
  zr25Aero: deriveLateralPathFromSweep(latSweepResults.zr25Aero)
};
  const latHandlingResults = {
    zr26Base: runHandlingCurve(lateralVehicles.zr26Base),
    zr26Aero: runHandlingCurve(lateralVehicles.zr26Aero),
    zr25Aero: runHandlingCurve(lateralVehicles.zr25Aero)
  };

  /* =========================================================
     Summaries
  ========================================================= */

  const ackermannSteerDeg = (commonLat.L / 15.25) * (180 / Math.PI);

  function getLatSummary(key) {
    const sweep = latSweepResults[key];
    const handling = latHandlingResults[key];
    const car = lateralVehicles[key];

    let skidIdx = 0;
    let bestErr = Infinity;
    sweep.R.forEach((r, i) => {
      const err = Math.abs(r - 15.25);
      if (err < bestErr) {
        bestErr = err;
        skidIdx = i;
      }
    });

    const vSkidMps = sweep.V_max[skidIdx];
    const vSkidMph = vSkidMps * 2.23694;

    const downforceSkid =
      0.5 * commonLat.rho * vSkidMps * vSkidMps * car.A * car.Cl;

    let idx1g = 0;
    let best1gErr = Infinity;
    handling.ay_g.forEach((v, i) => {
      const err = Math.abs(v - 1.0);
      if (err < best1gErr) {
        best1gErr = err;
        idx1g = i;
      }
    });

    const K1g =
      (handling.delta_lin_deg[idx1g] - ackermannSteerDeg) / handling.ay_g[idx1g];

    return {
      peakHighSpeedG: Math.max(...sweep.ay_g),
      fsaeSkidpadG: Math.max(...handling.ay_valid),
      speedAtR1525Mph: vSkidMph,
      K1g,
      KfitAvg: handling.K_fit,
      aeroDownforceSkidN: downforceSkid
    };
  }

  const latSummary = {
    zr26Base: getLatSummary("zr26Base"),
    zr26Aero: getLatSummary("zr26Aero"),
    zr25Aero: getLatSummary("zr25Aero")
  };

  /* =========================================================
     Build Output
  ========================================================= */

  const vehicleNames = {
    zr26Base: { key: "zr26Base", name: "ZR26 Base" },
    zr26Aero: { key: "zr26Aero", name: "ZR26 Aero" },
    zr25Aero: { key: "zr25Aero", name: "ZR25 Aero" }
  };

  window.seniorDemoData = {
    vehicles: vehicleNames,

    longitudinal: {
      metrics: [
        makeMetricRow("0–30 mph Time", "s", {
          zr26Base: round(longResults.zr26Base.t_acc_end, 2).toFixed(2),
          zr26Aero: round(longResults.zr26Aero.t_acc_end, 2).toFixed(2),
          zr25Aero: round(longResults.zr25Aero.t_acc_end, 2).toFixed(2)
        }),
        makeMetricRow("30–0 mph Distance", "m", {
          zr26Base: round(longResults.zr26Base.x_brake_end, 2).toFixed(2),
          zr26Aero: round(longResults.zr26Aero.x_brake_end, 2).toFixed(2),
          zr25Aero: round(longResults.zr25Aero.x_brake_end, 2).toFixed(2)
        }),
        makeMetricRow("Peak Acceleration", "G", {
          zr26Base: round(longResults.zr26Base.peak_accel_g, 2).toFixed(2),
          zr26Aero: round(longResults.zr26Aero.peak_accel_g, 2).toFixed(2),
          zr25Aero: round(longResults.zr25Aero.peak_accel_g, 2).toFixed(2)
        }),
        makeMetricRow("Peak Deceleration", "G", {
          zr26Base: round(Math.abs(longResults.zr26Base.peak_brake_g), 2).toFixed(2),
          zr26Aero: round(Math.abs(longResults.zr26Aero.peak_brake_g), 2).toFixed(2),
          zr25Aero: round(Math.abs(longResults.zr25Aero.peak_brake_g), 2).toFixed(2)
        })
      ],

      secondary: [
        makeMetricRow("Max Downforce", "N", {
          zr26Base: round(longResults.zr26Base.max_downforce_N, 1).toFixed(1),
          zr26Aero: round(longResults.zr26Aero.max_downforce_N, 1).toFixed(1),
          zr25Aero: round(longResults.zr25Aero.max_downforce_N, 1).toFixed(1)
        }),
        makeMetricRow("Max Drag", "N", {
          zr26Base: round(longResults.zr26Base.max_drag_N, 1).toFixed(1),
          zr26Aero: round(longResults.zr26Aero.max_drag_N, 1).toFixed(1),
          zr25Aero: round(longResults.zr25Aero.max_drag_N, 1).toFixed(1)
        }),
        makeMetricRow("Max Weight Transfer Gain", "N", {
          zr26Base: round(longResults.zr26Base.max_delta_W_front_N, 1).toFixed(1),
          zr26Aero: round(longResults.zr26Aero.max_delta_W_front_N, 1).toFixed(1),
          zr25Aero: round(longResults.zr25Aero.max_delta_W_front_N, 1).toFixed(1)
        })
      ],

      charts: {
        accel: {
          position: {
            title: "Position vs Time",
            xLabel: "Time (s)",
            yLabel: "Distance (m)",
            labels: toLabelArray(longResults.zr26Base.t_acc, 3),
            series: [
              {
                key: "zr26Base",
                label: "ZR26 Base",
                data: longResults.zr26Base.x_acc.map((v) => round(v, 4))
              },
              {
                key: "zr26Aero",
                label: "ZR26 Aero",
                data: longResults.zr26Aero.x_acc.map((v) => round(v, 4))
              },
              {
                key: "zr25Aero",
                label: "ZR25 Aero",
                data: longResults.zr25Aero.x_acc.map((v) => round(v, 4))
              }
            ]
          },

          velocity: {
            title: "Velocity vs Time",
            xLabel: "Time (s)",
            yLabel: "Velocity (m/s)",
            labels: toLabelArray(longResults.zr26Base.t_acc, 3),
            series: [
              {
                key: "zr26Base",
                label: "ZR26 Base",
                data: longResults.zr26Base.v_acc.map((v) => round(v, 4))
              },
              {
                key: "zr26Aero",
                label: "ZR26 Aero",
                data: longResults.zr26Aero.v_acc.map((v) => round(v, 4))
              },
              {
                key: "zr25Aero",
                label: "ZR25 Aero",
                data: longResults.zr25Aero.v_acc.map((v) => round(v, 4))
              }
            ]
          },

          acceleration: {
            title: "Acceleration vs Time",
            xLabel: "Time (s)",
            yLabel: "Acceleration (m/s²)",
            labels: toLabelArray(longResults.zr26Base.t_acc, 3),
            series: [
              {
                key: "zr26Base",
                label: "ZR26 Base",
                data: longResults.zr26Base.a_acc.map((v) => round(v, 4))
              },
              {
                key: "zr26Aero",
                label: "ZR26 Aero",
                data: longResults.zr26Aero.a_acc.map((v) => round(v, 4))
              },
              {
                key: "zr25Aero",
                label: "ZR25 Aero",
                data: longResults.zr25Aero.a_acc.map((v) => round(v, 4))
              }
            ]
          },

          loads: {
            title: "Axle Loads vs Time",
            xLabel: "Time (s)",
            yLabel: "Normal Load (kN)",
            labels: toLabelArray(longResults.zr26Base.t_acc, 3),
            series: [
              {
                key: "zr26Base-front",
                label: "ZR26 Base Front",
                data: longResults.zr26Base.Wf_acc.map((v) => round(v / 1000, 4))
              },
              {
                key: "zr26Base-rear",
                label: "ZR26 Base Rear",
                data: longResults.zr26Base.Wr_acc.map((v) => round(v / 1000, 4))
              },
              {
                key: "zr26Aero-front",
                label: "ZR26 Aero Front",
                data: longResults.zr26Aero.Wf_acc.map((v) => round(v / 1000, 4))
              },
              {
                key: "zr26Aero-rear",
                label: "ZR26 Aero Rear",
                data: longResults.zr26Aero.Wr_acc.map((v) => round(v / 1000, 4))
              },
              {
                key: "zr25Aero-front",
                label: "ZR25 Aero Front",
                data: longResults.zr25Aero.Wf_acc.map((v) => round(v / 1000, 4))
              },
              {
                key: "zr25Aero-rear",
                label: "ZR25 Aero Rear",
                data: longResults.zr25Aero.Wr_acc.map((v) => round(v / 1000, 4))
              }
            ]
          }
        },

        brake: {
          position: {
            title: "Distance vs Time",
            xLabel: "Time (s)",
            yLabel: "Distance (m)",
            labels: toLabelArray(longResults.zr26Base.t_brake, 3),
            series: [
              {
                key: "zr26Base",
                label: "ZR26 Base",
                data: longResults.zr26Base.x_brake.map((v) => round(v, 4))
              },
              {
                key: "zr26Aero",
                label: "ZR26 Aero",
                data: longResults.zr26Aero.x_brake.map((v) => round(v, 4))
              },
              {
                key: "zr25Aero",
                label: "ZR25 Aero",
                data: longResults.zr25Aero.x_brake.map((v) => round(v, 4))
              }
            ]
          },

          velocity: {
            title: "Velocity vs Time",
            xLabel: "Time (s)",
            yLabel: "Velocity (m/s)",
            labels: toLabelArray(longResults.zr26Base.t_brake, 3),
            series: [
              {
                key: "zr26Base",
                label: "ZR26 Base",
                data: longResults.zr26Base.v_brake.map((v) => round(v, 4))
              },
              {
                key: "zr26Aero",
                label: "ZR26 Aero",
                data: longResults.zr26Aero.v_brake.map((v) => round(v, 4))
              },
              {
                key: "zr25Aero",
                label: "ZR25 Aero",
                data: longResults.zr25Aero.v_brake.map((v) => round(v, 4))
              }
            ]
          },

          acceleration: {
            title: "Acceleration vs Time",
            xLabel: "Time (s)",
            yLabel: "Acceleration (m/s²)",
            labels: toLabelArray(longResults.zr26Base.t_brake, 3),
            series: [
              {
                key: "zr26Base",
                label: "ZR26 Base",
                data: longResults.zr26Base.a_brake.map((v) => round(v, 4))
              },
              {
                key: "zr26Aero",
                label: "ZR26 Aero",
                data: longResults.zr26Aero.a_brake.map((v) => round(v, 4))
              },
              {
                key: "zr25Aero",
                label: "ZR25 Aero",
                data: longResults.zr25Aero.a_brake.map((v) => round(v, 4))
              }
            ]
          },

          loads: {
            title: "Axle Loads vs Time",
            xLabel: "Time (s)",
            yLabel: "Normal Load (kN)",
            labels: toLabelArray(longResults.zr26Base.t_brake, 3),
            series: [
              {
                key: "zr26Base-front",
                label: "ZR26 Base Front",
                data: longResults.zr26Base.Wf_brake.map((v) => round(v / 1000, 4))
              },
              {
                key: "zr26Base-rear",
                label: "ZR26 Base Rear",
                data: longResults.zr26Base.Wr_brake.map((v) => round(v / 1000, 4))
              },
              {
                key: "zr26Aero-front",
                label: "ZR26 Aero Front",
                data: longResults.zr26Aero.Wf_brake.map((v) => round(v / 1000, 4))
              },
              {
                key: "zr26Aero-rear",
                label: "ZR26 Aero Rear",
                data: longResults.zr26Aero.Wr_brake.map((v) => round(v / 1000, 4))
              },
              {
                key: "zr25Aero-front",
                label: "ZR25 Aero Front",
                data: longResults.zr25Aero.Wf_brake.map((v) => round(v / 1000, 4))
              },
              {
                key: "zr25Aero-rear",
                label: "ZR25 Aero Rear",
                data: longResults.zr25Aero.Wr_brake.map((v) => round(v / 1000, 4))
              }
            ]
          }
        }
      }
    },

    lateral: {
      metrics: [
        makeMetricRow("Peak High-Speed G", "G", {
          zr26Base: round(latSummary.zr26Base.peakHighSpeedG, 2).toFixed(2),
          zr26Aero: round(latSummary.zr26Aero.peakHighSpeedG, 2).toFixed(2),
          zr25Aero: round(latSummary.zr25Aero.peakHighSpeedG, 2).toFixed(2)
        }),
        makeMetricRow("FSAE Skidpad G", "G", {
          zr26Base: round(latSummary.zr26Base.fsaeSkidpadG, 2).toFixed(2),
          zr26Aero: round(latSummary.zr26Aero.fsaeSkidpadG, 2).toFixed(2),
          zr25Aero: round(latSummary.zr25Aero.fsaeSkidpadG, 2).toFixed(2)
        }),
        makeMetricRow("Speed @ R = 15.25 m", "mph", {
          zr26Base: round(latSummary.zr26Base.speedAtR1525Mph, 2).toFixed(2),
          zr26Aero: round(latSummary.zr26Aero.speedAtR1525Mph, 2).toFixed(2),
          zr25Aero: round(latSummary.zr25Aero.speedAtR1525Mph, 2).toFixed(2)
        }),
        makeMetricRow("K @ 1.0 G", "deg/G", {
          zr26Base: round(latSummary.zr26Base.K1g, 2).toFixed(2),
          zr26Aero: round(latSummary.zr26Aero.K1g, 2).toFixed(2),
          zr25Aero: round(latSummary.zr25Aero.K1g, 2).toFixed(2)
        })
      ],

      secondary: [
        makeMetricRow("K Fit Avg", "deg/G", {
          zr26Base: round(latSummary.zr26Base.KfitAvg, 2).toFixed(2),
          zr26Aero: round(latSummary.zr26Aero.KfitAvg, 2).toFixed(2),
          zr25Aero: round(latSummary.zr25Aero.KfitAvg, 2).toFixed(2)
        }),
        makeMetricRow("Aero Downforce @ Skidpad", "N", {
          zr26Base: round(latSummary.zr26Base.aeroDownforceSkidN, 1).toFixed(1),
          zr26Aero: round(latSummary.zr26Aero.aeroDownforceSkidN, 1).toFixed(1),
          zr25Aero: round(latSummary.zr25Aero.aeroDownforceSkidN, 1).toFixed(1)
        })
      ],
pathStates: {
  zr26Base: latPathResults.zr26Base,
  zr26Aero: latPathResults.zr26Aero,
  zr25Aero: latPathResults.zr25Aero
},
      charts: {
        sweep: {
          steer: {
            title: "Steering Input vs Time",
            xLabel: "Time (s)",
            yLabel: "Steer Angle (deg)",
            labels: toLabelArray(latSweepResults.zr26Base.time, 2),
            series: [
              {
                key: "zr26Base",
                label: "ZR26 Base",
                data: latSweepResults.zr26Base.delta_deg.map((v) => round(v, 4))
              },
              {
                key: "zr26Aero",
                label: "ZR26 Aero",
                data: latSweepResults.zr26Aero.delta_deg.map((v) => round(v, 4))
              },
              {
                key: "zr25Aero",
                label: "ZR25 Aero",
                data: latSweepResults.zr25Aero.delta_deg.map((v) => round(v, 4))
              }
            ]
          },

          accel: {
            title: "Lateral Acceleration vs Time",
            xLabel: "Time (s)",
            yLabel: "Lat Accel (G)",
            labels: toLabelArray(latSweepResults.zr26Base.time, 2),
            series: [
              {
                key: "zr26Base",
                label: "ZR26 Base",
                data: latSweepResults.zr26Base.ay_g.map((v) => round(v, 4))
              },
              {
                key: "zr26Aero",
                label: "ZR26 Aero",
                data: latSweepResults.zr26Aero.ay_g.map((v) => round(v, 4))
              },
              {
                key: "zr25Aero",
                label: "ZR25 Aero",
                data: latSweepResults.zr25Aero.ay_g.map((v) => round(v, 4))
              }
            ]
          },

          sideslip: {
            title: "Body Sideslip vs Time",
            xLabel: "Time (s)",
            yLabel: "Sideslip (deg)",
            labels: toLabelArray(latSweepResults.zr26Base.time, 2),
            series: [
              {
                key: "zr26Base",
                label: "ZR26 Base",
                data: latSweepResults.zr26Base.beta_deg.map((v) => round(v, 4))
              },
              {
                key: "zr26Aero",
                label: "ZR26 Aero",
                data: latSweepResults.zr26Aero.beta_deg.map((v) => round(v, 4))
              },
              {
                key: "zr25Aero",
                label: "ZR25 Aero",
                data: latSweepResults.zr25Aero.beta_deg.map((v) => round(v, 4))
              }
            ]
          },

          yaw: {
            title: "Yaw Rate vs Time",
            xLabel: "Time (s)",
            yLabel: "Yaw Rate (deg/s)",
            labels: toLabelArray(latSweepResults.zr26Base.time, 2),
            series: [
              {
                key: "zr26Base",
                label: "ZR26 Base",
                data: latSweepResults.zr26Base.r_degps.map((v) => round(v, 4))
              },
              {
                key: "zr26Aero",
                label: "ZR26 Aero",
                data: latSweepResults.zr26Aero.r_degps.map((v) => round(v, 4))
              },
              {
                key: "zr25Aero",
                label: "ZR25 Aero",
                data: latSweepResults.zr25Aero.r_degps.map((v) => round(v, 4))
              }
            ]
          },
pathX: {
  title: "Global X Position vs Time",
  xLabel: "Time (s)",
  yLabel: "X Position (m)",
  labels: toLabelArray(latSweepResults.zr26Base.time, 2),
  series: [
    {
      key: "zr26Base",
      label: "ZR26 Base",
      data: latPathResults.zr26Base.x
    },
    {
      key: "zr26Aero",
      label: "ZR26 Aero",
      data: latPathResults.zr26Aero.x
    },
    {
      key: "zr25Aero",
      label: "ZR25 Aero",
      data: latPathResults.zr25Aero.x
    }
  ]
},

pathY: {
  title: "Global Y Position vs Time",
  xLabel: "Time (s)",
  yLabel: "Y Position (m)",
  labels: toLabelArray(latSweepResults.zr26Base.time, 2),
  series: [
    {
      key: "zr26Base",
      label: "ZR26 Base",
      data: latPathResults.zr26Base.y
    },
    {
      key: "zr26Aero",
      label: "ZR26 Aero",
      data: latPathResults.zr26Aero.y
    },
    {
      key: "zr25Aero",
      label: "ZR25 Aero",
      data: latPathResults.zr25Aero.y
    }
  ]
},

yawAngle: {
  title: "Yaw Angle vs Time",
  xLabel: "Time (s)",
  yLabel: "Yaw Angle (deg)",
  labels: toLabelArray(latSweepResults.zr26Base.time, 2),
  series: [
    {
      key: "zr26Base",
      label: "ZR26 Base",
      data: latPathResults.zr26Base.yaw_deg
    },
    {
      key: "zr26Aero",
      label: "ZR26 Aero",
      data: latPathResults.zr26Aero.yaw_deg
    },
    {
      key: "zr25Aero",
      label: "ZR25 Aero",
      data: latPathResults.zr25Aero.yaw_deg
    }
  ]
},

heading: {
  title: "Velocity Heading vs Time",
  xLabel: "Time (s)",
  yLabel: "Heading (deg)",
  labels: toLabelArray(latSweepResults.zr26Base.time, 2),
  series: [
    {
      key: "zr26Base",
      label: "ZR26 Base",
      data: latPathResults.zr26Base.heading_deg
    },
    {
      key: "zr26Aero",
      label: "ZR26 Aero",
      data: latPathResults.zr26Aero.heading_deg
    },
    {
      key: "zr25Aero",
      label: "ZR25 Aero",
      data: latPathResults.zr25Aero.heading_deg
    }
  ]
}
          loads: {
            title: "Vertical Tire Loads vs Time",
            xLabel: "Time (s)",
            yLabel: "Vertical Load (N)",
            labels: toLabelArray(latSweepResults.zr26Base.time, 2),
            series: [
              {
                key: "zr26Base-front",
                label: "ZR26 Base Fzf",
                data: latSweepResults.zr26Base.Fzf.map((v) => round(v, 2))
              },
              {
                key: "zr26Base-rear",
                label: "ZR26 Base Fzr",
                data: latSweepResults.zr26Base.Fzr.map((v) => round(v, 2))
              },
              {
                key: "zr26Aero-front",
                label: "ZR26 Aero Fzf",
                data: latSweepResults.zr26Aero.Fzf.map((v) => round(v, 2))
              },
              {
                key: "zr26Aero-rear",
                label: "ZR26 Aero Fzr",
                data: latSweepResults.zr26Aero.Fzr.map((v) => round(v, 2))
              },
              {
                key: "zr25Aero-front",
                label: "ZR25 Aero Fzf",
                data: latSweepResults.zr25Aero.Fzf.map((v) => round(v, 2))
              },
              {
                key: "zr25Aero-rear",
                label: "ZR25 Aero Fzr",
                data: latSweepResults.zr25Aero.Fzr.map((v) => round(v, 2))
              }
            ]
          }
        },

        handling: {
          main: {
            title: "Handling Curve",
            xLabel: "Lateral Acceleration (G)",
            yLabel: "Steering Wheel Angle (deg)",
            labels: toLabelArray(latHandlingResults.zr26Base.ay_valid, 3),
            series: [
              {
                key: "zr26Base",
                label: "ZR26 Base",
                data: latHandlingResults.zr26Base.delta_lin_deg.map((v) => round(v, 4))
              },
              {
                key: "zr26Aero",
                label: "ZR26 Aero",
                data: latHandlingResults.zr26Aero.delta_lin_deg.map((v) => round(v, 4))
              },
              {
                key: "zr25Aero",
                label: "ZR25 Aero",
                data: latHandlingResults.zr25Aero.delta_lin_deg.map((v) => round(v, 4))
              },
              {
                key: "zr26Base-fit",
                label: "ZR26 Base Fit",
                data: latHandlingResults.zr26Base.delta_fit_line.map((v) => round(v, 4))
              },
              {
                key: "zr26Aero-fit",
                label: "ZR26 Aero Fit",
                data: latHandlingResults.zr26Aero.delta_fit_line.map((v) => round(v, 4))
              },
              {
                key: "zr25Aero-fit",
                label: "ZR25 Aero Fit",
                data: latHandlingResults.zr25Aero.delta_fit_line.map((v) => round(v, 4))
              },
              {
                key: "ackermann",
                label: "Ackermann Reference",
                data: latHandlingResults.zr26Base.ay_valid.map(() => round(ackermannSteerDeg, 4))
              }
            ]
          }
        }
      }
    }
  };
})();
