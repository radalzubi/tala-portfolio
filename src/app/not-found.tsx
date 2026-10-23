import Link from "next/link";
import type { Metadata } from "next";
import { projectsByOrder } from "@/content/projects";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="sheet py-20">
      <p className="meta">404</p>
      <h1 className="display-md mt-3">This page is not in the portfolio.</h1>
      <p className="prose-editorial mt-5">The address may be out of date. The work, the research chapter and the about page are all one step away.</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projectsByOrder.map((pr) => (
          <li key={pr.slug}>
            <Link href={`/work/${pr.slug}`} className="control w-full justify-between">
              {pr.title}
              <span className="meta">{pr.location}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link href="/research/cairo" className="control w-full">
            Research: Cairo
          </Link>
        </li>
        <li>
          <Link href="/about" className="control w-full">
            About Tala
          </Link>
        </li>
        <li>
          <Link href="/" className="control w-full">
            Home
          </Link>
        </li>
      </ul>
    </div>
  );
}
