import { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren<{}>) {
  return (
    <div className='min-h-screen flex flex-col gap-16'>
      <main className='mb-auto pt-24'>
        {children}
      </main>
    </div>
  )
}
