import Loader from "@/components/atoms/loader";
import { months, pascalCase } from "@/helpers/formatters";
import { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";

const colours_ = ["#0ea5e9", "#991b1b"];

export default function ChartOne({ data }) {
  const [series, setSeries] = useState("");
  const [filter, setFilter] = useState("year");
  const [chartOptions, setChartOptions] = useState("");
  //onFilter change
  useEffect(() => {
    if (data) {
      setSeries(parseData(filter, data));
      setChartOptions({
        legend: {
          show: false,
          position: "top",
          horizontalAlign: "left",
        },
        colors: colours_,
        chart: {
          fontFamily: "Satoshi, sans-serif",
          height: 335,
          type: "area",
          dropShadow: {
            enabled: true,
            color: "#623CEA14",
            top: 10,
            blur: 4,
            left: 0,
            opacity: 0.1,
          },

          toolbar: {
            show: false,
          },
        },
        responsive: [
          {
            breakpoint: 1024,
            options: {
              chart: {
                height: 300,
              },
            },
          },
          {
            breakpoint: 1366,
            options: {
              chart: {
                height: 350,
              },
            },
          },
        ],
        stroke: {
          width: [2, 2],
          curve: "straight",
        },
        // labels: {
        //   show: false,
        //   position: "top",
        // },
        grid: {
          xaxis: {
            lines: {
              show: true,
            },
          },
          yaxis: {
            lines: {
              show: true,
            },
          },
        },
        dataLabels: {
          enabled: false,
        },
        markers: {
          size: 4,
          colors: "#fff",
          strokeColors: colours_,
          strokeWidth: 3,
          strokeOpacity: 0.9,
          strokeDashArray: 0,
          fillOpacity: 1,
          discrete: [],
          hover: {
            size: undefined,
            sizeOffset: 5,
          },
        },
        xaxis: {
          type: "category",
          categories: filter === "year" ? data.year.map((v) => v.month) : [],
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: {
          title: {
            style: {
              fontSize: "0px",
            },
          },
          min: 0,
          max:
            Math.max(
              ...[
                ...data.year.map((v) => v.notifications),
                ...data.year.map((v) => v.redAlerts),
              ]
            ) * 1.2,
        },
      });
    }
  }, [filter, data]);
  //render
  return (
    <div className="card col-span-12 xl:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="flex w-full flex-wrap gap-3 sm:gap-5">
          <div className="flex min-w-48">
            <span className="mr-2 mt-1 flex h-4 w-full max-w-4 items-center justify-center rounded-full border-none">
              <span className="block h-3  w-full max-w-3 rounded-full bg-sky-500"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-sky-800">Notifications</p>
              <p className="text-sm font-medium">12.04.2022 - 12.05.2022</p>
            </div>
          </div>
          <div className="flex min-w-48">
            <span className="mr-2 mt-1 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-none">
              <span className="block h-3 w-full max-w-3 rounded-full bg-red-700"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-red-900">Red Alerts</p>
              <p className="text-sm font-medium">12.04.2022 - 12.05.2022</p>
            </div>
          </div>
        </div>
        <div className="flex w-full max-w-44 justify-end">
          <div className="inline-flex items-center rounded-md bg-gray-300 p-2">
            {Object.keys(data).map((v) => (
              <button
                key={v}
                className={`rounded px-3 py-1 text-xs font-medium hover:shadow-lg ${
                  filter === v
                    ? "text-white bg-gray-800"
                    : "hover:bg-blue-500 hover:text-white"
                }`}
              >
                {pascalCase(v)}
              </button>
            ))}

            <button className="rounded px-3 py-1 text-xs font-medium hover:bg-blue-500 hover:text-white hover:shadow-lg">
              Year
            </button>
          </div>
        </div>
      </div>

      <div>
        <div id="chartOne" className="-ml-5">
          {series ? (
            <ReactApexChart
              options={chartOptions}
              series={series}
              type="area"
              height={"100%"}
              width={"100%"}
            />
          ) : (
            <div className="flex items-center justify-center m-auto">
              <Loader />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function parseData(filt, objArray) {
  if (filt === "year")
    return [
      {
        name: "Notifications",
        data: objArray.year.map((v) => v.notifications),
      },
      { name: "Red Alerts", data: objArray.year.map((v) => v.redAlerts) },
    ];
  else if (filt === "month")
    return [
      {
        name: "Notifications",
        data: objArray.month.map((v) => v.notifications),
      },
      { name: "Red Alerts", data: objArray.month.map((v) => v.redAlerts) },
    ];
  else return "";
}
