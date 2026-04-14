import Head from 'next/head';
import {
  ProfileFormSection,
  LinkedWalletsSection,
  ApiKeysSection,
} from '@/components/features/Profile';

export default function ProfilePage() {
  return (
    <>
      <Head>
        <title>Profile – Wrytes</title>
      </Head>
      <ProfileFormSection />
      <LinkedWalletsSection />
      <ApiKeysSection />
    </>
  );
}
