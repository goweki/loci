import Loader from "@/components/atoms/loader";
import { months, weeksToNowArray, pascalCase } from "@/helpers/formatters";
import { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";

const colours_ = { green: "#6ee7b7", gray: "#71717a", red: "#f87171" };

export default function ChartOne({ data }) {
  const [series, setSeries] = useState("");
  const [filter, setFilter] = useState("year");
  const [chartOptions, setChartOptions] = useState("");
  //onFilter change
  useEffect(() => {
    if (data) {
      // console.log('data: ', data[filter])
      setSeries(data[filter].data);
    }
  }, [data, filter]);

  //on series change
  useEffect(() => {
    if (series) {
      setChartOptions({
        legend: {
          show: false,
          position: "top",
          horizontalAlign: "left",
        },
        colors: series.map(({ name }) => colours_[name]),
        chart: {
          // fontFamily: "Satoshi, sans-serif",
          // height: 335,
          // type: "area",
          toolbar: {
            show: false,
          },
        },
        // responsive: [
        //   {
        //     breakpoint: 1024,
        //     options: {
        //       chart: {
        //         height: 300,
        //       },
        //     },
        //   },
        //   {
        //     breakpoint: 1366,
        //     options: {
        //       chart: {
        //         height: 350,
        //       },
        //     },
        //   },
        // ],
        // stroke: {
        //   width: [2, 2],
        //   curve: "straight",
        // },
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
        xaxis: {
          type: "category",
          categories: data[filter].labels,
        },
        legend: {
          position: "top",
          horizontalAlign: "left",
          fontFamily: "Satoshi",
          fontSize: "14px",
        },
      });
    }
  }, [series]);
  //render
  if (data && series)
    return (
      <div className="card min-h-96 col-span-12 xl:col-span-8">

        <div className="flex justify-between">
          <div>
            <h4 className="text-xl font-semibold">
              Monthly Notifications
            </h4>
          </div>
          <div className="inline-flex items-center rounded-md bg-gray-300 p-2">
            {data &&
              Object.keys(data).map((v) => (
                <button
                  key={v}
                  className={`rounded px-3 py-1 text-xs font-medium hover:shadow-lg ${filter === v
                    ? "text-white bg-gray-800"
                    : "hover:bg-blue-500 hover:text-white"
                    }`}
                  onClick={() => setFilter(v)}
                >
                  {v === 'year' ? 'months' : 'weeks'}
                </button>
              ))}
          </div>
        </div>

        <div id="chartOne" className="h-full -ml-5">
          {series && chartOptions ? (
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
    );
}
