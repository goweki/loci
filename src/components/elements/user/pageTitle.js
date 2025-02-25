import Link from "next/link";

function Title({ title, children }) {
    return (<div className="flex flex-row justify-between items-center">
        {children}
        <h3 className="my-auto">{title}</h3>
        <div className="w-32" />
    </div>)

}

export function DevicesTitle({ title }) {
    return (<Title title={title}>
        <Link href="/user/devices" className="border-sky-700 border-2 hover:bg-sky-800 focus:ring-4 focus:outline-none font-medium rounded-lg text-xs py-1 px-2 text-center inline-flex items-center me-2 hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            <span className="ml-1">All devices</span>
            <span className="sr-only">All devices</span>
        </Link>
    </Title>)
}

