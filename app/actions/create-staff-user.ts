"use server"

import { createClient } from "@supabase/supabase-js"

export async function createStaffUser(formData: {
  nombre: string
  email: string
  telefono: string
  rol: string
  posicion: string
  salario_base: string
  company_id: string
}) {
  console.log("[v0] createStaffUser called with:", formData)

  // Create admin client with service role key
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + "A1!"
    console.log("[v0] Generated temp password:", tempPassword)

    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser?.users.find((u) => u.email === formData.email)

    let authUserId: string

    if (userExists) {
      console.log("[v0] User already exists, using existing user ID:", userExists.id)
      authUserId = userExists.id
      // Update the password for the existing user
      await supabaseAdmin.auth.admin.updateUserById(userExists.id, {
        password: tempPassword,
      })
    } else {
      // Create the auth user
      console.log("[v0] Creating new auth user...")
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: tempPassword,
        email_confirm: true,
      })

      if (authError) {
        console.error("[v0] Auth error:", authError)
        throw new Error(`Error creating auth user: ${authError.message}`)
      }

      console.log("[v0] Auth user created with ID:", authData.user.id)
      authUserId = authData.user.id
    }

    console.log("[v0] Upserting profile record...")
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: authUserId,
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono || null,
          rol: formData.rol,
          posicion: formData.posicion || null,
          salario_base: formData.salario_base ? Number.parseFloat(formData.salario_base) : null,
          company_id: formData.company_id,
        },
        {
          onConflict: "id",
        },
      )
      .select()
      .single()

    if (profileError) {
      console.error("[v0] Profile error:", profileError)
      throw new Error(`Error creating profile: ${profileError.message}`)
    }

    console.log("[v0] Profile created/updated successfully:", profileData)

    return {
      success: true,
      data: profileData,
      tempPassword,
    }
  } catch (error: any) {
    console.error("[v0] Caught error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function updateStaffUser(
  userId: string,
  formData: {
    nombre: string
    email: string
    telefono: string
    rol: string
    posicion: string
    salario_base: string
  },
) {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        nombre: formData.nombre,
        telefono: formData.telefono || null,
        rol: formData.rol,
        posicion: formData.posicion || null,
        salario_base: formData.salario_base ? Number.parseFloat(formData.salario_base) : null,
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating profile: ${error.message}`)
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function deleteStaffUser(userId: string) {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Delete the profile first
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId)

    if (profileError) {
      throw new Error(`Error deleting profile: ${profileError.message}`)
    }

    // Delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      throw new Error(`Error deleting auth user: ${authError.message}`)
    }

    return {
      success: true,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}
