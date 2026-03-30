/* =========================================================
   Senior Project Demo Data
   Temporary event-only demo dataset
========================================================= */

window.seniorDemoData = {
  vehicles: {
    zr26Base: {
      key: "zr26Base",
      name: "ZR26 Base"
    },
    zr26Aero: {
      key: "zr26Aero",
      name: "ZR26 Aero"
    },
    zr25Aero: {
      key: "zr25Aero",
      name: "ZR25 Aero"
    }
  },

  longitudinal: {
    metrics: [
      {
        label: "0–30 mph Time",
        unit: "s",
        values: {
          zr26Base: "2.31",
          zr26Aero: "2.18",
          zr25Aero: "2.42"
        }
      },
      {
        label: "30–0 mph Distance",
        unit: "m",
        values: {
          zr26Base: "8.94",
          zr26Aero: "7.88",
          zr25Aero: "8.21"
        }
      },
      {
        label: "Peak Acceleration",
        unit: "G",
        values: {
          zr26Base: "1.24",
          zr26Aero: "1.31",
          zr25Aero: "1.19"
        }
      },
      {
        label: "Peak Deceleration",
        unit: "G",
        values: {
          zr26Base: "1.39",
          zr26Aero: "1.56",
          zr25Aero: "1.48"
        }
      }
    ],

    secondary: [
      {
        label: "Max Downforce",
        unit: "N",
        values: {
          zr26Base: "13.2",
          zr26Aero: "161.4",
          zr25Aero: "116.5"
        }
      },
      {
        label: "Max Drag",
        unit: "N",
        values: {
          zr26Base: "21.0",
          zr26Aero: "72.0",
          zr25Aero: "68.2"
        }
      },
      {
        label: "Max Weight Transfer Gain",
        unit: "N",
        values: {
          zr26Base: "294.8",
          zr26Aero: "351.4",
          zr25Aero: "338.2"
        }
      }
    ],

    charts: {
      accel: {
        position: {
          title: "Position vs Time",
          xLabel: "Time (s)",
          yLabel: "Distance (m)",
          labels: ["0.0", "0.4", "0.8", "1.2", "1.6", "2.0", "2.4"],
          series: [
            {
              key: "zr26Base",
              label: "ZR26 Base",
              data: [0.0, 0.3, 1.2, 2.8, 5.2, 8.3, 12.0]
            },
            {
              key: "zr26Aero",
              label: "ZR26 Aero",
              data: [0.0, 0.35, 1.35, 3.05, 5.7, 9.0, 12.9]
            },
            {
              key: "zr25Aero",
              label: "ZR25 Aero",
              data: [0.0, 0.25, 1.0, 2.45, 4.75, 7.65, 11.1]
            }
          ]
        },

        velocity: {
          title: "Velocity vs Time",
          xLabel: "Time (s)",
          yLabel: "Velocity (m/s)",
          labels: ["0.0", "0.4", "0.8", "1.2", "1.6", "2.0", "2.4"],
          series: [
            {
              key: "zr26Base",
              label: "ZR26 Base",
              data: [0.0, 2.7, 5.5, 8.1, 10.6, 12.6, 13.4]
            },
            {
              key: "zr26Aero",
              label: "ZR26 Aero",
              data: [0.0, 2.9, 5.9, 8.7, 11.2, 13.0, 13.4]
            },
            {
              key: "zr25Aero",
              label: "ZR25 Aero",
              data: [0.0, 2.5, 5.0, 7.5, 9.8, 11.8, 13.1]
            }
          ]
        },

        acceleration: {
          title: "Acceleration vs Time",
          xLabel: "Time (s)",
          yLabel: "Acceleration (m/s²)",
          labels: ["0.0", "0.4", "0.8", "1.2", "1.6", "2.0", "2.4"],
          series: [
            {
              key: "zr26Base",
              label: "ZR26 Base",
              data: [12.2, 11.8, 11.1, 10.0, 8.6, 6.8, 3.2]
            },
            {
              key: "zr26Aero",
              label: "ZR26 Aero",
              data: [12.8, 12.4, 11.7, 10.8, 9.4, 7.4, 3.4]
            },
            {
              key: "zr25Aero",
              label: "ZR25 Aero",
              data: [11.7, 11.1, 10.3, 9.4, 8.1, 6.2, 3.0]
            }
          ]
        },

        loads: {
          title: "Axle Loads vs Time",
          xLabel: "Time (s)",
          yLabel: "Normal Load (kN)",
          labels: ["0.0", "0.4", "0.8", "1.2", "1.6", "2.0", "2.4"],
          series: [
            {
              key: "zr26Base-front",
              label: "ZR26 Base Front",
              data: [1.30, 1.26, 1.23, 1.20, 1.18, 1.16, 1.15]
            },
            {
              key: "zr26Base-rear",
              label: "ZR26 Base Rear",
              data: [1.41, 1.46, 1.49, 1.52, 1.54, 1.56, 1.57]
            },
            {
              key: "zr26Aero-front",
              label: "ZR26 Aero Front",
              data: [1.35, 1.34, 1.33, 1.31, 1.30, 1.30, 1.29]
            },
            {
              key: "zr26Aero-rear",
              label: "ZR26 Aero Rear",
              data: [1.46, 1.51, 1.55, 1.60, 1.64, 1.67, 1.69]
            },
            {
              key: "zr25Aero-front",
              label: "ZR25 Aero Front",
              data: [1.46, 1.43, 1.40, 1.38, 1.36, 1.35, 1.34]
            },
            {
              key: "zr25Aero-rear",
              label: "ZR25 Aero Rear",
              data: [1.58, 1.63, 1.67, 1.70, 1.73, 1.75, 1.76]
            }
          ]
        }
      },

      brake: {
        position: {
          title: "Distance vs Time",
          xLabel: "Time (s)",
          yLabel: "Distance (m)",
          labels: ["0.0", "0.2", "0.4", "0.6", "0.8", "1.0", "1.2"],
          series: [
            {
              key: "zr26Base",
              label: "ZR26 Base",
              data: [0.0, 2.4, 4.6, 6.5, 7.8, 8.6, 8.9]
            },
            {
              key: "zr26Aero",
              label: "ZR26 Aero",
              data: [0.0, 2.2, 4.1, 5.7, 6.8, 7.5, 7.9]
            },
            {
              key: "zr25Aero",
              label: "ZR25 Aero",
              data: [0.0, 2.3, 4.3, 6.0, 7.2, 8.0, 8.2]
            }
          ]
        },

        velocity: {
          title: "Velocity vs Time",
          xLabel: "Time (s)",
          yLabel: "Velocity (m/s)",
          labels: ["0.0", "0.2", "0.4", "0.6", "0.8", "1.0", "1.2"],
          series: [
            {
              key: "zr26Base",
              label: "ZR26 Base",
              data: [13.4, 11.0, 8.6, 6.1, 3.8, 1.7, 0.0]
            },
            {
              key: "zr26Aero",
              label: "ZR26 Aero",
              data: [13.4, 10.7, 8.0, 5.3, 2.9, 0.9, 0.0]
            },
            {
              key: "zr25Aero",
              label: "ZR25 Aero",
              data: [13.4, 10.8, 8.2, 5.7, 3.3, 1.2, 0.0]
            }
          ]
        },

        acceleration: {
          title: "Acceleration vs Time",
          xLabel: "Time (s)",
          yLabel: "Acceleration (m/s²)",
          labels: ["0.0", "0.2", "0.4", "0.6", "0.8", "1.0", "1.2"],
          series: [
            {
              key: "zr26Base",
              label: "ZR26 Base",
              data: [-13.2, -13.0, -12.8, -12.4, -11.8, -10.7, -8.3]
            },
            {
              key: "zr26Aero",
              label: "ZR26 Aero",
              data: [-15.0, -14.7, -14.3, -13.7, -12.8, -11.0, -8.8]
            },
            {
              key: "zr25Aero",
              label: "ZR25 Aero",
              data: [-14.3, -14.0, -13.6, -13.0, -12.2, -10.8, -8.5]
            }
          ]
        },

        loads: {
          title: "Axle Loads vs Time",
          xLabel: "Time (s)",
          yLabel: "Normal Load (kN)",
          labels: ["0.0", "0.2", "0.4", "0.6", "0.8", "1.0", "1.2"],
          series: [
            {
              key: "zr26Base-front",
              label: "ZR26 Base Front",
              data: [1.30, 1.55, 1.60, 1.63, 1.65, 1.62, 1.58]
            },
            {
              key: "zr26Base-rear",
              label: "ZR26 Base Rear",
              data: [1.41, 1.18, 1.13, 1.10, 1.08, 1.10, 1.13]
            },
            {
              key: "zr26Aero-front",
              label: "ZR26 Aero Front",
              data: [1.35, 1.68, 1.74, 1.79, 1.82, 1.78, 1.71]
            },
            {
              key: "zr26Aero-rear",
              label: "ZR26 Aero Rear",
              data: [1.46, 1.24, 1.20, 1.17, 1.15, 1.19, 1.24]
            },
            {
              key: "zr25Aero-front",
              label: "ZR25 Aero Front",
              data: [1.46, 1.74, 1.79, 1.83, 1.86, 1.82, 1.76]
            },
            {
              key: "zr25Aero-rear",
              label: "ZR25 Aero Rear",
              data: [1.58, 1.33, 1.29, 1.26, 1.23, 1.27, 1.31]
            }
          ]
        }
      }
    }
  },

  lateral: {
    metrics: [
      {
        label: "Peak High-Speed G",
        unit: "G",
        values: {
          zr26Base: "1.48",
          zr26Aero: "1.92",
          zr25Aero: "1.73"
        }
      },
      {
        label: "FSAE Skidpad G",
        unit: "G",
        values: {
          zr26Base: "1.36",
          zr26Aero: "1.71",
          zr25Aero: "1.59"
        }
      },
      {
        label: "Speed @ R = 15.25 m",
        unit: "mph",
        values: {
          zr26Base: "31.4",
          zr26Aero: "35.1",
          zr25Aero: "33.8"
        }
      },
      {
        label: "K @ 1.0 G",
        unit: "deg/G",
        values: {
          zr26Base: "0.82",
          zr26Aero: "0.57",
          zr25Aero: "0.64"
        }
      }
    ],

    secondary: [
      {
        label: "K Fit Avg",
        unit: "deg/G",
        values: {
          zr26Base: "0.88",
          zr26Aero: "0.60",
          zr25Aero: "0.69"
        }
      },
      {
        label: "Aero Downforce @ Skidpad",
        unit: "N",
        values: {
          zr26Base: "16.4",
          zr26Aero: "196.2",
          zr25Aero: "149.8"
        }
      }
    ],

    charts: {
      sweep: {
        steer: {
          title: "Steering Input vs Time",
          xLabel: "Time (s)",
          yLabel: "Steer Angle (deg)",
          labels: ["0", "2", "4", "6", "8", "10"],
          series: [
            {
              key: "zr26Base",
              label: "ZR26 Base",
              data: [2.9, 5.0, 7.2, 9.4, 11.5, 13.7]
            },
            {
              key: "zr26Aero",
              label: "ZR26 Aero",
              data: [2.9, 5.0, 7.2, 9.4, 11.5, 13.7]
            },
            {
              key: "zr25Aero",
              label: "ZR25 Aero",
              data: [2.9, 5.0, 7.2, 9.4, 11.5, 13.7]
            }
          ]
        },

        accel: {
          title: "Lateral Acceleration vs Time",
          xLabel: "Time (s)",
          yLabel: "Lat Accel (G)",
          labels: ["0", "2", "4", "6", "8", "10"],
          series: [
            {
              key: "zr26Base",
              label: "ZR26 Base",
              data: [0.20, 0.52, 0.85, 1.10, 1.31, 1.48]
            },
            {
              key: "zr26Aero",
              label: "ZR26 Aero",
              data: [0.21, 0.58, 0.99, 1.34, 1.66, 1.92]
            },
            {
              key: "zr25Aero",
              label: "ZR25 Aero",
              data: [0.20, 0.56, 0.93, 1.23, 1.50, 1.73]
            }
          ]
        },

        sideslip: {
          title: "Body Sideslip vs Time",
          xLabel: "Time (s)",
          yLabel: "Sideslip (deg)",
          labels: ["0", "2", "4", "6", "8", "10"],
          series: [
            {
              key: "zr26Base",
              label: "ZR26 Base",
              data: [0.10, 0.28, 0.44, 0.60, 0.74, 0.89]
            },
            {
              key: "zr26Aero",
              label: "ZR26 Aero",
              data: [0.08, 0.22, 0.34, 0.45, 0.55, 0.64]
            },
            {
              key: "zr25Aero",
              label: "ZR25 Aero",
              data: [0.09, 0.25, 0.39, 0.52, 0.63, 0.74]
            }
          ]
        },

        yaw: {
          title: "Yaw Rate vs Time",
          xLabel: "Time (s)",
          yLabel: "Yaw Rate (deg/s)",
          labels: ["0", "2", "4", "6", "8", "10"],
          series: [
            {
              key: "zr26Base",
              label: "ZR26 Base",
              data: [2.4, 5.8, 9.6, 13.4, 17.2, 21.0]
            },
            {
              key: "zr26Aero",
              label: "ZR26 Aero",
              data: [2.6, 6.4, 10.8, 15.1, 19.5, 23.8]
            },
            {
              key: "zr25Aero",
              label: "ZR25 Aero",
              data: [2.5, 6.1, 10.1, 14.2, 18.2, 22.1]
            }
          ]
        },

        loads: {
          title: "Vertical Tire Loads vs Time",
          xLabel: "Time (s)",
          yLabel: "Vertical Load (N)",
          labels: ["0", "2", "4", "6", "8", "10"],
          series: [
            {
              key: "zr26Base-front",
              label: "ZR26 Base Fzf",
              data: [1320, 1330, 1342, 1354, 1365, 1374]
            },
            {
              key: "zr26Base-rear",
              label: "ZR26 Base Fzr",
              data: [1430, 1442, 1455, 1468, 1480, 1490]
            },
            {
              key: "zr26Aero-front",
              label: "ZR26 Aero Fzf",
              data: [1370, 1420, 1485, 1560, 1640, 1725]
            },
            {
              key: "zr26Aero-rear",
              label: "ZR26 Aero Fzr",
              data: [1480, 1540, 1620, 1710, 1810, 1915]
            },
            {
              key: "zr25Aero-front",
              label: "ZR25 Aero Fzf",
              data: [1480, 1525, 1585, 1650, 1720, 1790]
            },
            {
              key: "zr25Aero-rear",
              label: "ZR25 Aero Fzr",
              data: [1590, 1655, 1735, 1820, 1910, 2005]
            }
          ]
        }
      },

      handling: {
        main: {
          title: "Handling Curve",
          xLabel: "Lateral Acceleration (G)",
          yLabel: "Steering Wheel Angle (deg)",
          labels: ["0.2", "0.5", "0.8", "1.1", "1.4", "1.7"],
          series: [
            {
              key: "zr26Base",
              label: "ZR26 Base",
              data: [5.9, 6.4, 7.0, 7.8, 8.8, 10.1]
            },
            {
              key: "zr26Aero",
              label: "ZR26 Aero",
              data: [5.8, 6.1, 6.5, 7.0, 7.6, 8.4]
            },
            {
              key: "zr25Aero",
              label: "ZR25 Aero",
              data: [5.8, 6.2, 6.7, 7.3, 8.0, 8.9]
            },
            {
              key: "zr26Base-fit",
              label: "ZR26 Base Fit",
              data: [5.85, 6.45, 7.05, 7.75, 8.65, 9.85]
            },
            {
              key: "zr26Aero-fit",
              label: "ZR26 Aero Fit",
              data: [5.78, 6.12, 6.52, 7.02, 7.62, 8.32]
            },
            {
              key: "zr25Aero-fit",
              label: "ZR25 Aero Fit",
              data: [5.80, 6.22, 6.72, 7.30, 7.98, 8.80]
            },
            {
              key: "ackermann",
              label: "Ackerman Reference",
              data: [5.7, 5.7, 5.7, 5.7, 5.7, 5.7]
            }
          ]
        }
      }
    }
  }
};
