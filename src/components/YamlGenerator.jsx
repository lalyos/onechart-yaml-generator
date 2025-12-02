import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'
import HelmUI from "helm-react-ui";
import { ThemeSelector } from './ThemeSelector';
import YAML from "json-to-pretty-yaml";
import * as onechartSchema from '@/components/values.schema.json'
import * as staticSchema from '@/components/static-values.schema.json'
import * as cronjobSchema from '@/components/cronjob-values.schema.json'
import { onechartUISchema, staticUISchema, cronjobUISchema } from '@/components/helmUI'
import axios from "axios";
import CopyButton from './CopyButton';
import Highlight, { defaultProps } from 'prism-react-renderer'
import clsx from 'clsx'
import Link from 'next/link'
import * as Fathom from "fathom-client";

export function YamlGenerator() {
  const [values, setValues] = useState({})
  const [nonDefaultValues, setNonDefaultValues] = useState({})
  const [kubernetesYaml, setKubernetesYaml] = useState("")

  const router = useRouter()
  const ref = router.pathname.slice(1).replaceAll("/", "-")
  const [charts, setCharts] = useState([
    { title: "Web application", current: true, name: "onechart" },
    { title: "Static sites", current: false, name: "static-site" },
    { title: "Cron job", current: false, name: "cron-job" }
  ]);
  const selected = 'border-neutral-200 bg-white text-neutral-900 shadow-sm';
  const notSelected = 'border-transparent text-neutral-700';

  useEffect(() => {
   const handleKeyDown = (event) => {
      var ctrlDown = event.ctrlKey || event.metaKey // Mac support
      if (ctrlDown && event.key === 'c') {
        Fathom.trackGoal("32GVHPPE", 0)
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, []);

  function validationCallback(errors) {
    if (errors) {
      console.log(errors);
    }
  };

  const chartHandler = (chartName) => {
    setCharts(charts.map(chart => {
      if (chart.name === chartName) {
        return { ...chart, current: true }
      } else {
        return { ...chart, current: false }
      }
    }))
  }

  function valuesSetter(values, nonDefaultValues) {
    setValues(values);
    setNonDefaultValues(nonDefaultValues);
  }

  useEffect(() => {
    const url = new URL(window.location.href);
    const chartFromParams = url.searchParams.get("chart");
    
    if (chartFromParams) {
      chartHandler(chartFromParams)
    }

    const stateString = window.location.hash.substr(1); // remove the '#'

    if (stateString) {
      const decodedString = atob(stateString);
      const parsedObject = JSON.parse(decodedString);
      setValues(parsedObject);
      setNonDefaultValues(parsedObject);
    }
  }, []);

  useEffect(() => {
    const nonDefaultValuesString = JSON.stringify(nonDefaultValues)
    const base64ObjectState = btoa(nonDefaultValuesString)
    const newUrl = window.location.origin + window.location.pathname + window.location.search + '#' + base64ObjectState;
    if (nonDefaultValuesString !== "{}") {
      window.history.pushState(null, '', newUrl);
    }
  }, [nonDefaultValues]);

  useEffect(() => {
    const chart = charts.find(chart => chart.current);
    const baseUrl = process.env.NEXT_PUBLIC_YAML_GENERATOR_URL || 'https://yaml-generator.gimlet.io';
    postWithAxios(`${baseUrl}/chart/${chart.name}`, nonDefaultValues).then(data => {
      setKubernetesYaml(data)
    }).catch(err => {
      console.error(`Error: ${err}`);
    });
  }, [nonDefaultValues, charts]);

  const chart = charts.find(chart => chart.current);
  const diffBody = `cat << EOF > values.yaml
${YAML.stringify(nonDefaultValues)}EOF

helm repo add onechart https://chart.onechart.dev
helm template my-release onechart/${chart.name} -f values.yaml`

  if (kubernetesYaml === "") {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900">
      <div aria-live="assertive" className="absolute inset-x-0 top-0 pointer-events-none hidden lg:block opacity-75">
        <span className="float-right flex mr-96 -mt-12">
        <img src="/arrow.svg" className="scale-75 w-32 block dark:hidden flip"/>
        <img src="/arrow-white.svg" className="scale-75 w-32 hidden dark:block flip" />
        <span className="mt-24 -ml-4 font-mono font-bold text-xs dark:text-slate-100">Shareable link!</span>
        </span>
      </div>
      <div className="text-center pt-12 sm:pt-16">
        <img src="/logo.svg" alt="Gimlet" className='h-10 sm:h-16 inline' />
      </div>
      <div className="mx-auto p-2 sm:p-4 lg:p-6">
        <header className="grid sm:grid-cols-3 items-center mt-8 mb-20">
          <div className="text-gray-900 dark:text-slate-50 font-semibold sm:col-start-2">
            <h1 className="sm:text-4xl text-center">Kubernetes YAML Generator</h1>
            <p className="text-xs text-right">originally made by <a href="https://gimlet.io/" rel="noreferrer" target="_blank" className="underline">gimlet.io</a></p>
          </div>
          <div className="col-start-3 justify-self-end mr-10">
            <ThemeSelector className="relative z-10 items-end" />
          </div>
        </header>
        <div className="mx-auto mb-16 max-w-8xl sm:px-6 lg:px-8">
          <div className="sm:align-center sm:flex sm:flex-col">
            <div className="relative flex self-center rounded-lg bg-neutral-100 p-0.5">
              {charts.map((chart) => (
                <button
                  key={chart.name}
                  type="button"
                  onClick={e => {
                    chartHandler(chart.name)
                    setValues({});
                    setNonDefaultValues({});
                    router.query.chart = chart.name
                    router.push(router)
                  }}
                  className={(chart.current ? selected : notSelected) + ' relative w-1/2 whitespace-nowrap rounded-md py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-auto sm:px-8'}
                >
                  {chart.title}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="sm:align-center sm:flex sm:flex-col space-y-2">
          <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0 xl:grid-cols-8">
            <div className="dark:bg-white border-2 p-4 rounded-md col-span-5">
              <HelmUI
                key={charts[0].current ? charts[0].name : charts[1].current ? charts[1].name : charts[2].name}
                schema={charts[0].current ? onechartSchema : charts[1].current ? staticSchema : cronjobSchema}
                config={charts[0].current ? onechartUISchema : charts[1].current ? staticUISchema :cronjobUISchema}
                values={values}
                setValues={valuesSetter}
                validate={true}
                validationCallback={validationCallback}
              />
            </div>
            <div className="p-2 rounded-md bg-highlight-dark col-span-3 flex flex-col">
              <CopyButton
                text={kubernetesYaml}
                style="light"
                feedback={true}
              />
              <Highlight
                {...defaultProps}
                code={kubernetesYaml}
                language="bash"
                theme={undefined}
              >
                {({
                  className,
                  style,
                }) => (
                  <pre
                    className={clsx(
                      className,
                      'flex overflow-x-auto pb-6'
                    )}
                    style={style}
                  >
                    <code className="px-4">
                      {kubernetesYaml}
                    </code>
                  </pre>
                )}
              </Highlight>
            </div>
          </div>
          <div className="container max-w-5xl mx-auto dark:text-slate-50 py-32 font-medium text-xl">
            <p className="pt-4">
              The YAML is generated with a Helm chart.<br />
              A Helm chart that you can also use on your terminal.
            </p>
            <p className="pt-4"></p>
            <p className="pt-4">Try this:</p>
            <div className="mt-8 p-2 rounded-md border-2 bg-highlight-light flex flex-col text-sm">
              <CopyButton
                text={diffBody}
                style="dark"
              />
              <Highlight
                {...defaultProps}
                code={diffBody}
                language="bash"
                theme={undefined}
              >
                {({
                  className,
                  style,
                }) => (
                  <pre
                    className={clsx(
                      className,
                      'flex overflow-x-auto pb-6'
                    )}
                    style={style}
                  >
                    <code className="px-4 text-gray-800">
                      {diffBody}
                    </code>
                  </pre>
                )}
              </Highlight>
            </div>
            <p className='pt-16 text-base text-blue-500'>
              See the full <a href="/onechart-reference" className="underline">Onechart Reference documentation</a> for all available configuration options.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const postWithAxios = async (path, body) => {
  try {
    const { data } = await axios
      .post(path, body, {
        withCredentials: false,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
    return data;
  } catch (error) {
    this.onError(error.response);
    throw error.response;
  }
}
