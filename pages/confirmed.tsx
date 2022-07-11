import BackLink from '../components/BackLink';
import Confirmed from '../components/Confirmed';
import PageHeading from '../components/PageHeading';

export default function ConfirmedPage() {
  return (
    <div className='flex flex-col gap-8 items-center gradient-bg-welcome h-screen'>
      <BackLink href='/'>Home</BackLink>

      <PageHeading>Payment Successful. Thank you!</PageHeading>

      <div className='h-80 w-80'><Confirmed /></div>
    </div>
  )
}